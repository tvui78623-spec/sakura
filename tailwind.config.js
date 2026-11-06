
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  min-height: 100%;
}

body {
  background: #080414;
  color: white;
  font-family: 'Prompt', sans-serif;
}

.sakura-home {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 30px;
}

/* BACKGROUND */
.sakura-background {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(
      90deg,
      rgba(8, 3, 20, .12),
      rgba(8, 3, 20, .42)
    ),
    linear-gradient(
      0deg,
      rgba(8, 3, 20, .48),
      transparent 55%
    ),
    url('/anime.png');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.02);
}

/* CONTENT */
.sakura-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 490px;
  margin-left: auto;
  margin-right: 5%;
  text-align: center;
  padding: 20px;
  text-shadow: 0 2px 15px #10051f;
}

.premium {
  display: inline-block;
  color: #ff9bea;
  font-size: 12px;
  letter-spacing: 5px;
  margin-bottom: 15px;
}

.sakura-content h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(38px, 5vw, 65px);
  letter-spacing: 8px;
  color: #ff8ce8;
  text-shadow:
    0 0 10px #ff35dc,
    0 0 35px #ff35dc;
}

.sakura-content h2 {
  margin-top: 12px;
  color: white;
  font-size: 25px;
  line-height: 1.5;
}

.sakura-content h2 span {
  color: #ff9bea;
}

.subtitle {
  margin-top: 18px;
  color: #ffc3f2;
  font-size: 11px;
  letter-spacing: 3px;
}

.description {
  margin: 20px auto;
  max-width: 390px;
  color: #f5e7fa;
  font-size: 13px;
  line-height: 1.9;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 25px;
}

.login-button,
.invite-button {
  display: inline-block;
  min-width: 235px;
  padding: 12px 22px;
  border-radius: 30px;
  text-decoration: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  transition: .3s;
  backdrop-filter: blur(8px);
}

.login-button {
  background: rgba(88, 101, 242, .82);
  border: 1px solid #aeb5ff;
  box-shadow: 0 0 20px #5865f277;
}

.invite-button {
  background: rgba(190, 55, 170, .32);
  border: 1px solid #ff8ce8;
}

.login-button:hover,
.invite-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 25px #ff55dd;
}

.features {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 28px;
  color: #ffc2f1;
  font-size: 10px;
}

.sakura-content footer {
  margin-top: 30px;
  font-size: 9px;
  letter-spacing: 2px;
  color: #e8c2ed;
}

/* MOBILE */
@media (max-width: 768px) {
  .sakura-home {
    padding: 20px;
  }

  .sakura-background {
    background-position: center;
  }

  .sakura-content {
    margin: auto;
    padding: 15px;
  }

  .sakura-content h2 {
    font-size: 21px;
  }

  .features {
    gap: 10px;
  }
}
