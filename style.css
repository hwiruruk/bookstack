@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
:root { 
    --bg: #050505; 
    --card-bg: #0f0f0f; 
    --shelf-color: #1a1a1a;
    --accent: #00ff88; 
    --text-main: #ffffff; 
    --text-sub: #888888;
}

body { 
    font-family: 'Pretendard', sans-serif; 
    background: var(--bg); 
    color: var(--text-main); 
    padding: 3rem 1.5rem; 
    min-height: 100vh;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

.container { max-width: 1680px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5rem; }
.title-container { display: flex; align-items: center; gap: 12px; }
.logo-bar { height: 3px; background: var(--accent); border-radius: 2px; margin-bottom: 4px; }
.title { font-size: 1.4rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }

.header-buttons { display: flex; align-items: center; gap: 10px; }
#syncStatus { font-size: 0.7rem; color: var(--accent); opacity: 0.8; }

.btn { 
    padding: 0.6rem 1.2rem; border: 1px solid #222; 
    background: transparent; color: var(--text-sub); border-radius: 4px; 
    cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: 0.3s;
}
.btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(0,255,136,0.05); }
.btn-new-stack { border-color: var(--accent); color: var(--accent); background: rgba(0,255,136,0.1); }

.hero-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin-bottom: 2rem; }
.hero-text h2 { font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1rem; letter-spacing: -0.02em; }

.search-box {
    background: #111; padding: 1rem 1.5rem; border-radius: 8px;
    display: flex; align-items: center; border: 1px solid #222;
}
.search-box input { background: transparent; border: none; color: white; flex: 1; outline: none; font-size: 1rem; }
.clear-btn { cursor: pointer; opacity: 0.5; margin-right: 15px; font-weight: bold; font-size: 1.2rem; }

.stats-container {
    background: #0f0f0f; border: 1px solid #1a1a1a; padding: 1rem 2rem; border-radius: 12px;
    margin-bottom: 4rem; position: relative; overflow: hidden; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.stats-container.collapsed { height: 60px; padding: 0.8rem 2rem; cursor: pointer; }
.stats-header { display: flex; justify-content: space-between; align-items: center; }
.stats-title { font-size: 1.6rem; font-weight: 900; color: var(--accent); letter-spacing: 0.1em; }
.stats-toggle-btn { background: rgba(0, 255, 136, 0.1); border: 1px solid var(--accent); color: var(--accent); font-size: 0.75rem; padding: 6px 16px; border-radius: 20px; cursor: pointer; }

#shelfList { display: flex; flex-direction: column; gap: 5rem; }
.shelf-wrapper { background: var(--card-bg); border-radius: 12px; padding: 2rem; border: 1px solid #1a1a1a; position: relative; }
.shelf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
.shelf-title { font-size: 1.1rem; font-weight: 900; border: none; background: transparent; outline: none; }

.book-grid-display { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1.5rem; }
.book { position: relative; transition: 0.4s; cursor: pointer; }
.book:hover { transform: translateY(-10px); }
.book img { width: 100%; height: auto; border-radius: 4px; box-shadow: 5px 10px 20px rgba(0,0,0,0.6); }

.search-results { display: flex; gap: 1.5rem; overflow-x: auto; padding: 1rem 0; min-height: 200px; }
.search-item { width: 100px; flex-shrink: 0; cursor: pointer; opacity: 0.6; transition: 0.3s; }
.search-item img { width: 100%; border-radius: 2px; }

#guideModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
.guide-box { background: #111; border: 1px solid var(--accent); width: 90%; max-width: 500px; border-radius: 20px; padding: 40px; color: #fff; position: relative; }
.close-guide { position: absolute; top: 20px; right: 20px; font-size: 1.5rem; cursor: pointer; opacity: 0.5; }

.help-fab { position: fixed; bottom: 30px; right: 30px; width: 56px; height: 56px; background: var(--accent); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; z-index: 999; border: none; }
