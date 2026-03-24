// 1. 유전 정보 설정
const firebaseConfig = {
    apiKey: "AIzaSyBfBYodmAEL-lnKfFn8KLXMc7XqCO1w4zw",
    authDomain: "reading-lab-69ea0.firebaseapp.com",
    projectId: "reading-lab-69ea0",
    storageBucket: "reading-lab-69ea0.firebasestorage.app",
    messagingSenderId: "45130148120",
    appId: "1:45130148120:web:96629d86ca19972c6a166d",
    measurementId: "G-C4YNCKXL96"
};

// 2. 파이어베이스 초기 활성화
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const TTB_KEY = 'ttbtwinwhee0938001';

let currentUser = null;
let shelves = [];
let selectedItems = [];
let shelfExpandedStates = {};

const hipColors = ['#ffffff', '#00ff88', '#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#adb5bd', '#ff5400', '#00f5d4', '#9d4edd'];

// 3. 사용자 식별 및 동기화 (항상성 유지)
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginMessage').style.display = 'none';
        document.getElementById('syncStatus').innerText = `${user.displayName}님 접속 중`;
        
        // 사용자의 개별 서고에서 기록 불러오기
        loadData();
    } else {
        currentUser = null;
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('loginMessage').style.display = 'block';
        document.getElementById('syncStatus').innerText = "인증 필요";
    }
});

function handleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
}

function handleLogout() {
    auth.signOut();
}

// 4. 정보 기록 및 추출 (대사 작용)
async function save() {
    if (!currentUser) return;
    document.getElementById('syncStatus').innerText = "기록 중...";
    try {
        await db.collection("users").doc(currentUser.uid).set({
            shelves: shelves,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('syncStatus').innerText = "안전하게 보관됨";
    } catch (e) {
        console.error("저장 오류:", e);
        document.getElementById('syncStatus').innerText = "보관 실패";
    }
}

async function loadData() {
    const doc = await db.collection("users").doc(currentUser.uid).get();
    if (doc.exists) {
        shelves = doc.data().shelves || [];
    } else {
        shelves = [{ title: 'MY COLLECTION', books: [], color: '#ffffff' }];
    }
    render();
}

// 5. 알라딘 검색 (외부 정보 섭취)
async function searchByKeyword() {
    const kw = document.getElementById('kwInput').value;
    if (!kw) return;

    const apiUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=${encodeURIComponent(kw)}&QueryType=Keyword&MaxResults=15&start=1&SearchTarget=Book&output=js&Version=20131101`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const rawData = await response.json();
        let content = rawData.contents.trim();
        if (content.endsWith(';')) content = content.substring(0, content.length ～ 1);
        const data = JSON.parse(content);

        const results = document.getElementById('searchResults');
        results.innerHTML = '';

        if (data.item) {
            data.item.forEach(i => {
                const book = {
                    title: i.title.replace(/<[^>]*>?/gm, ''),
                    cover: i.cover.replace('coversum', 'cover500'),
                    link: i.link,
                    author: i.author ? i.author.split('(지은이)')[0] : "",
                    publisher: i.publisher,
                    pubDate: i.pubDate,
                    addedDate: new Date().toLocaleDateString(),
                    memo: ""
                };
                const div = document.createElement('div');
                div.className = 'search-item';
                const isExist = shelves.some(s => s.books.some(b => b.title === book.title));
                div.innerHTML = `<img src="${book.cover}" title="${book.title}"><p style="font-size:9px; margin-top:5px; color:${isExist?'#00ff88':'white'}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${isExist?'[보유] ':''}${book.title}</p>`;
                div.onclick = () => { shelves[0].books.unshift(book); save(); render(); };
                results.appendChild(div);
            });
        }
    } catch (e) { console.error("검색 오류:", e); }
}

// (이하 render, addShelf, toggleStats 등 기존 UI 처리 로직은 동일하게 유지하되 save()를 호출하도록 연결)
// 예: function addShelf() { shelves.push({...}); save(); render(); }