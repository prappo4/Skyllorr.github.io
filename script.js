// Telegram Web App initialization
const tg = window.Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
}

// App State
let appState = {
  balance: 0,
  spinsToday: 0,
  totalSpins: 0,
  lastSpinDate: null,
  spinCooldown: null,
  payoutHistory: [],
  userId: null,
}

// Telegram Bot Configuration
const BOT_TOKEN = "8349513265:AAHjwW42vyNocmc-nyRGeA0PXcf-c7z5U9c"
const CHANNEL_CHAT_ID = "-1002834450973"

// Spin Wheel Configuration
const wheelColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]
const wheelSegments = 7
let isSpinning = false
let currentRotation = 0

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  loadUserData()
  updateUI()
  initializeSpinWheel()
  setupEventListeners()
})

function initializeApp() {
  // Get user ID from Telegram
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    appState.userId = tg.initDataUnsafe.user.id
  } else {
    // Fallback for testing
    appState.userId = Date.now().toString()
  }

  // Set affiliate link
  document.getElementById("affiliate-link").value = `https://t.me/Skyllor_bot?start=${appState.userId}`
}

function loadUserData() {
  const savedData = localStorage.getItem("skyllorAppData")
  if (savedData) {
    const parsedData = JSON.parse(savedData)
    appState = { ...appState, ...parsedData }
  }

  // Reset daily spins if it's a new day
  const today = new Date().toDateString()
  if (appState.lastSpinDate !== today) {
    appState.spinsToday = 0
    appState.lastSpinDate = today
    appState.spinCooldown = null
    saveUserData()
  }
}

function saveUserData() {
  localStorage.setItem("skyllorAppData", JSON.stringify(appState))
}

function updateUI() {
  // Update all balance displays
  document.getElementById("current-balance").textContent = appState.balance
  document.getElementById("payout-balance").textContent = appState.balance

  // Update spin displays
  document.getElementById("spins-today").textContent = appState.spinsToday
  document.getElementById("total-spins").textContent = appState.totalSpins
  document.getElementById("spin-spins-today").textContent = appState.spinsToday
  document.getElementById("spin-total-spins").textContent = appState.totalSpins

  // Update payout history
  updatePayoutHistory()

  // Check spin availability
  updateSpinButton()
}

function updateSpinButton() {
  const spinButton = document.getElementById("spin-button")
  const countdownTimer = document.getElementById("countdown-timer")

  if (appState.spinsToday >= 30) {
    spinButton.disabled = true
    spinButton.textContent = "Daily Limit Reached"
    countdownTimer.classList.add("hidden")
    return
  }

  if (appState.spinCooldown && new Date() < new Date(appState.spinCooldown)) {
    spinButton.disabled = true
    spinButton.textContent = "Cooling Down"
    countdownTimer.classList.remove("hidden")
    startCountdown()
  } else {
    spinButton.disabled = false
    spinButton.textContent = "Rotate Spin"
    countdownTimer.classList.add("hidden")
    appState.spinCooldown = null
    saveUserData()
  }
}

function startCountdown() {
  const countdownText = document.getElementById("countdown-text")

  const updateCountdown = () => {
    const now = new Date().getTime()
    const cooldownEnd = new Date(appState.spinCooldown).getTime()
    const distance = cooldownEnd - now

    if (distance < 0) {
      updateSpinButton()
      return
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    countdownText.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  updateCountdown()
  const countdownInterval = setInterval(updateCountdown, 1000)

  setTimeout(() => {
    clearInterval(countdownInterval)
    updateSpinButton()
  }, new Date(appState.spinCooldown) - new Date())
}

function initializeSpinWheel() {
  const canvas = document.getElementById("spin-wheel")
  const ctx = canvas.getContext("2d")
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = 140

  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const anglePerSegment = (2 * Math.PI) / wheelSegments

    for (let i = 0; i < wheelSegments; i++) {
      const startAngle = i * anglePerSegment
      const endAngle = (i + 1) * anglePerSegment

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = wheelColors[i]
      ctx.fill()

      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 3
      ctx.stroke()

      // Add segment numbers
      const textAngle = startAngle + anglePerSegment / 2
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7)
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7)

      ctx.fillStyle = "#fff"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText((i + 1).toString(), textX, textY)
    }

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
    ctx.fillStyle = "#40E0D0"
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 3
    ctx.stroke()
  }

  drawWheel()
}

async function handleSpin() {
  const spinButton = document.getElementById("spin-button") // Declare spinButton variable here
  if (isSpinning || appState.spinsToday >= 30) return

  try {
    // Show Gigapub ad first
    await window.showGiga()

    // Start spinning
    isSpinning = true
    spinButton.textContent = "Spinning..."
    spinButton.disabled = true

    // Spin the wheel
    const canvas = document.getElementById("spin-wheel")
    const spins = Math.random() * 5 + 5 // 5-10 full rotations
    const finalRotation = currentRotation + spins * 360
    currentRotation = finalRotation % 360

    canvas.style.transform = `rotate(${finalRotation}deg)`

    // Wait for spin to complete
    setTimeout(() => {
      // Award points
      appState.balance += 5
      appState.spinsToday += 1
      appState.totalSpins += 1

      // Set cooldown if needed
      if (appState.spinsToday % 10 === 0 && appState.spinsToday < 30) {
        const cooldownEnd = new Date()
        cooldownEnd.setHours(cooldownEnd.getHours() + 1)
        appState.spinCooldown = cooldownEnd.toISOString()
      }

      saveUserData()
      updateUI()

      // Show congratulations modal
      showModal("congratulations-modal")

      isSpinning = false
      spinButton.textContent = "Rotate Spin" // Ensure spinButton is updated here
      spinButton.disabled = false // Ensure spinButton is updated here
    }, 3000)
  } catch (error) {
    console.error("Ad error:", error)
    isSpinning = false
    spinButton.textContent = "Rotate Spin" // Ensure spinButton is updated here
    spinButton.disabled = false // Ensure spinButton is updated here
    alert("Please watch the ad to continue spinning!")
  }
}

function setupEventListeners() {
  // Payout form submission
  document.getElementById("payout-form").addEventListener("submit", handlePayoutSubmission)
}

async function handlePayoutSubmission(e) {
  e.preventDefault()

  const name = document.getElementById("payout-name").value
  const method = document.getElementById("payout-method").value
  const amount = Number.parseInt(document.getElementById("payout-amount").value)
  const address = document.getElementById("payout-address").value

  if (amount < 150) {
    alert("Minimum payout amount is 150 Sky")
    return
  }

  if (amount > appState.balance) {
    alert("Insufficient balance")
    return
  }

  // Deduct balance
  appState.balance -= amount

  // Add to history
  const payoutRecord = {
    date: new Date().toLocaleDateString(),
    amount: amount,
    method: method,
    status: "Pending",
  }

  appState.payoutHistory.push(payoutRecord)
  saveUserData()
  updateUI()

  // Send to Telegram
  await sendPayoutToTelegram({
    name,
    userId: appState.userId,
    amount,
    method,
    address,
    totalSpins: appState.totalSpins,
  })

  // Clear form
  document.getElementById("payout-form").reset()

  // Show success modal
  showModal("success-modal")
}

async function sendPayoutToTelegram(payoutData) {
  const message = `
🔔 NEW PAYOUT REQUEST

👤 Name: ${payoutData.name}
🆔 User ID: ${payoutData.userId}
💰 Amount: ${payoutData.amount} Sky
💳 Method: ${payoutData.method}
📍 Address: ${payoutData.address}
🎯 Total Spins: ${payoutData.totalSpins}
📅 Date: ${new Date().toLocaleString()}
    `

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHANNEL_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Failed to send to Telegram:", error)
  }
}

function updatePayoutHistory() {
  const historyList = document.getElementById("history-list")

  if (appState.payoutHistory.length === 0) {
    historyList.innerHTML = '<p class="no-history">No withdrawal history yet.</p>'
    return
  }

  historyList.innerHTML = appState.payoutHistory
    .map(
      (record) => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${record.amount} Sky</strong></span>
                <span style="color: #40E0D0;">${record.status}</span>
            </div>
            <div style="font-size: 12px; color: #aaa; margin-top: 5px;">
                ${record.method} • ${record.date}
            </div>
        </div>
    `,
    )
    .join("")
}

// Navigation Functions
function switchMenu(menuName) {
  // Hide all menus
  document.querySelectorAll(".menu-content").forEach((menu) => {
    menu.classList.remove("active")
  })

  // Show selected menu
  document.getElementById(`${menuName}-menu`).classList.add("active")

  // Update navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  document.querySelector(`[data-menu="${menuName}"]`).classList.add("active")
}

// Modal Functions
function showModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden")
}

// External Links
function openTelegramChannel() {
  window.open("https://t.me/Skyllorofficials", "_blank")
}

function openAffiliateBot() {
  window.open("http://t.me/Skylloraffiliate_bot", "_blank")
}

function copyAffiliateLink() {
  const linkInput = document.getElementById("affiliate-link")
  linkInput.select()
  linkInput.setSelectionRange(0, 99999)

  try {
    document.execCommand("copy")
    alert("Affiliate link copied to clipboard!")
  } catch (err) {
    console.error("Failed to copy: ", err)
  }
}

// Auto-save data every 30 seconds
setInterval(saveUserData, 30000)
