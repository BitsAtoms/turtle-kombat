/* Turtle Kombat media player: only user-provided images and videos, in the requested order. */
const video = document.getElementById('fightVideo');
const arenaAudio = document.getElementById('arenaAudio');
const still = document.getElementById('roundStill');
const roundHud = document.getElementById('roundHud');
const roundHudImage = document.getElementById('roundHudImage');
const sequenceOverlay = document.getElementById('sequenceOverlay');
const sequenceLabel = document.getElementById('sequenceLabel');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownLabel = document.getElementById('countdownLabel');
const finishOverlay = document.getElementById('finishOverlay');
const restartOverlay = document.getElementById('restartOverlay');
// Skip the short rhythmic lead-in of each segment so the spoken line starts with the on-screen announcement.
const arenaLines = { liu:[0.22,4.81], win:[4.62,10.2], leonatello:[9.42,14.42], gameOver:[14.72,19.27] };
let arenaStopTimer = null;
if (arenaAudio) arenaAudio.volume = 1;
const lineDuration = line => arenaLines[line][1] - arenaLines[line][0] + .25;

const rounds = [
  {
    still: 'assets/round-1.png',
    clips: [
      'assets/round-1-fight.mp4',
      'assets/round-1-finish.mp4'
    ]
  },
  {
    still: 'assets/round-2.png',
    clips: [
      'assets/round-2-fight.mp4',
      'assets/round-2-finish.mp4'
    ]
  }
];

const state = { round: 0, clip: 0, phase: 'title', stillTime: 0, transitionTime: 0, announcementStage: 0, announcementDuration: 1.5, started: false, lastCount: '' };

function playArenaLine(line) {
  if (!arenaAudio || !arenaLines[line]) return;
  const [from, to] = arenaLines[line];
  clearTimeout(arenaStopTimer);
  arenaAudio.volume = 1;
  arenaAudio.pause(); arenaAudio.currentTime = from;
  const promise = arenaAudio.play();
  if (promise) promise.catch(() => {});
  arenaStopTimer = setTimeout(() => { arenaAudio.pause(); arenaAudio.currentTime = from; }, (to - from) * 1000);
}


function restartSequence() {
  if (arenaAudio) {
    clearTimeout(arenaStopTimer);
    arenaAudio.pause(); arenaAudio.currentTime = 0;
  }
  state.started = false;
  startGame();
}

function showAnnouncement(text, line) {
  sequenceLabel.textContent = text;
  sequenceOverlay.classList.remove('hidden');
  const voiceDelay = line === 'leonatello' ? 900 : 180;
  setTimeout(() => { if (state.phase === 'announcement') playArenaLine(line); }, voiceDelay);
}

function loadRound(roundIndex, announcement = '') {
  state.round = roundIndex;
  state.clip = 0;
  state.phase = announcement ? 'announcement' : 'still';
  state.stillTime = 0;
  state.transitionTime = 0;
  state.announcementStage = 0;
  state.announcementDuration = announcement ? (roundIndex === 1 ? 3.5 : lineDuration('liu')) : 1.5;
  state.lastCount = '';
  video.pause(); video.removeAttribute('src'); video.load(); video.style.opacity = '1';
  still.src = rounds[roundIndex].still;
  still.style.display = 'block';
  roundHudImage.src = roundIndex === 0 ? 'assets/hud-round-1.png' : 'assets/hud-round-2.png';
  roundHud.style.display = 'none';
  countdownOverlay.classList.add('hidden');
  if (announcement) {
    showAnnouncement(roundIndex === 1 ? 'NINJA TURTLES WIN' : announcement, roundIndex === 1 ? 'win' : 'liu');
    SFX.round();
  } else sequenceOverlay.classList.add('hidden');
}

function playClip() {
  const clip = rounds[state.round].clips[state.clip];
  state.phase = 'video';
  countdownOverlay.classList.add('hidden');
  still.style.display = 'none';
  roundHud.style.display = 'block';
  video.style.opacity = '0';
  video.src = clip;
  video.currentTime = 0;
  video.muted = false;
  video.play().then(() => { requestAnimationFrame(() => { video.style.opacity = '1'; }); }).catch(() => { video.muted = true; video.play().catch(() => {}); video.style.opacity = '1'; });
}

function startGame() {
  if (state.started) return;
  state.started = true;
  loadRound(0, 'LIU KANG VS NINJA TURTLES');
}

document.addEventListener('pointerdown', () => { video.muted = false; if (arenaAudio) { const unlock = arenaAudio.play(); if (unlock) unlock.then(() => { arenaAudio.pause(); arenaAudio.currentTime = 0; if (state.phase === 'announcement') setTimeout(() => playArenaLine(state.round === 1 ? 'win' : 'liu'), 180); }).catch(() => {}); } }, { once: true });
startGame();

function handleEnded() {
  if (state.phase !== 'video') return;
  const clips = rounds[state.round].clips;
  if (state.clip < clips.length - 1) {
    state.clip += 1;
    video.style.opacity = '0';
    setTimeout(playClip, 280);
  } else if (state.round < rounds.length - 1) {
    video.pause(); video.style.opacity = '0'; roundHud.style.display = 'none';
    setTimeout(() => loadRound(state.round + 1, 'LAS TORTUGAS HAN GANADO · LEONATELLO VS RAPHELANGELO'), 360);
  } else {
    state.phase = 'finished';
    still.style.display = 'none';
    roundHud.style.display = 'none';
    state.transitionTime = 0;
    finishOverlay.classList.remove('hidden');
    SFX.win(); playArenaLine('gameOver');
  }
}
video.addEventListener('ended', handleEnded);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'announcement') {
    state.transitionTime += dt;
    if (state.transitionTime >= state.announcementDuration) {
      if (state.round === 1 && state.announcementStage === 0) {
        state.announcementStage = 1; state.transitionTime = 0; state.announcementDuration = lineDuration('leonatello'); showAnnouncement('LEONATELLO VS RAPHELANGELO', 'leonatello');
      } else { sequenceOverlay.classList.add('hidden'); state.phase = 'still'; state.stillTime = 0; }
    }
  } else if (state.phase === 'finished') {
    state.transitionTime += dt;
    if (state.transitionTime >= lineDuration('gameOver')) { finishOverlay.classList.add('hidden'); restartOverlay.classList.add('hidden'); restartSequence(); }
  } else if (state.phase === 'restart') {
    state.transitionTime += dt;
    if (state.transitionTime >= 1.5) { restartOverlay.classList.add('hidden'); loadRound(0); }
  } else if (state.phase === 'still') {
    state.stillTime += dt;
    const count = state.stillTime < 1 ? '3' : state.stillTime < 2 ? '2' : state.stillTime < 3 ? '1' : 'FIGHT!';
    countdownLabel.textContent = count;
    countdownOverlay.classList.remove('hidden');
    if (count !== state.lastCount) { state.lastCount = count; SFX.round(); }
    if (state.stillTime >= 3.8) playClip();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
