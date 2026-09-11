// 1. 환경 설정 및 인증 인자
const CLIENT_ID = '982927191150-uc696nka5n0n3j0qmjt0mjnl1tgsj7i0.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DATA_FILE_NAME = 'My_BookStack_Data_DO_NOT_DELETE';
// 예스24 Open API는 X-Api-Key 헤더 인증이라 브라우저에서 직접 호출할 수 없다.
// API Key는 절대 여기 두지 않고, 사용자가 배포한 Cloudflare Worker(프록시)의
// URL만 localStorage에 저장해 둔다. 배포 방법: tools/yes24-proxy/README.md
const YES24_PROXY_KEY = 'yes24ProxyUrl';

let tokenClient, gapiInited = false, gisInited = false, shelves = [], fileId = null;
const hipColors = ['#ffffff', '#00ff88', '#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#adb5bd', '#ff5400', '#00f5d4', '#9d4edd'];

// 2. 생성 및 초기화 단계
window.onload = () => {
    gapi.load('client', async () => {
        await gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });
        gapiInited = true;
        checkPersistentLogin(); 
    });
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES, callback: async (resp) => {
            if (resp.error) return;
            localStorage.setItem('gapi_token', JSON.stringify(resp));
            await afterLoggedIn();
        },
    });
    gisInited = true;
};

async function checkPersistentLogin() {
    const savedToken = localStorage.getItem('gapi_token');
    if (savedToken) {
        const token = JSON.parse(savedToken);
        gapi.client.setToken(token);
        await afterLoggedIn();
    } else {
        document.getElementById('syncStatus').innerText = "연결 준비 완료";
    }
}

async function afterLoggedIn() {
    document.getElementById('loginBtn').style.display = 'none';
    const userActions = document.getElementById('userActions');
    if (userActions) userActions.style.display = 'flex';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('loginMessage').style.display = 'none';
    await findOrCreateDataFile(); 
}

function handleLogin() { tokenClient.requestAccessToken({ prompt: 'consent' }); }
function handleLogout() { localStorage.removeItem('gapi_token'); location.reload(); }

// 3. 파일 식별 및 정보 추출 (호환성 보장)
async function findOrCreateDataFile() {
    try {
        const res = await gapi.client.drive.files.list({
            q: `name = '${DATA_FILE_NAME}' and trashed = false`,
            fields: 'files(id, name)'
        });
        
        if (res.result.files.length > 0) {
            fileId = res.result.files[0].id;
            await loadData();
        } else {
            // 파일이 없을 경우에만 초기 배열 생성
            shelves = [{ title: 'MY COLLECTION', books: [], color: '#ffffff' }];
            await save();
            render();
        }
    } catch (err) { console.error("파일 탐색 중 오류 발생"); }
}

async function loadData() {
    try {
        const content = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        const rawData = content.result;

        // 파일의 문법이 배열 형태인지 엄격하게 확인합니다. 
        if (Array.isArray(rawData)) {
            shelves = rawData;
        } else if (rawData && typeof rawData === 'object' && rawData.shelves) {
            shelves = rawData.shelves;
        } else {
            shelves = [{ title: 'MY COLLECTION', books: [], color: '#ffffff' }];
        }
        render();
        document.getElementById('syncStatus').innerText = "서재 연결됨";
    } catch (err) { console.error("정보 추출 실패"); }
}

// 4. 정보 보존 및 동기화 (순수 배열 저장)
async function save() {
    if (!gapi.client.getToken()) return;
    document.getElementById('syncStatus').innerText = "동기화 중...";
    
    const metadata = { 'name': DATA_FILE_NAME };
    // 다른 부가 정보 없이 오직 shelves 배열만 문자열로 변환합니다. 
    const bodyContent = JSON.stringify(shelves);
    
    const boundary = 'foo_bar_baz';
    const body = `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${bodyContent}\r\n--${boundary}--`;

    try {
        const path = fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files';
        const method = fileId ? 'PATCH' : 'POST';
        const res = await gapi.client.request({
            path: path, method: method, params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: body
        });
        if (!fileId) fileId = res.result.id;
        document.getElementById('syncStatus').innerText = "동기화 완료";
    } catch (err) { document.getElementById('syncStatus').innerText = "동기화 실패"; }
}

// 5. 화면 구성 및 검색 (기존 로직 유지)
function render() {
    const container = document.getElementById('shelfList');
    container.innerHTML = '';
    shelves.forEach((s, sIdx) => {
        const shelfEl = document.createElement('div');
        shelfEl.className = 'shelf-wrapper';
        shelfEl.style.marginBottom = "30px";
        shelfEl.innerHTML = `
            <div class="shelf-header" style="margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                <input type="text" class="shelf-title" value="${s.title}" style="color:${s.color}; background:transparent; border:none; font-size:1.2rem; font-weight:900;" onchange="shelves[${sIdx}].title=this.value; save();">
                <button onclick="deleteShelf(${sIdx})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:0.8rem;">삭제</button>
            </div>
            <div class="book-grid-display" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:15px;">
                ${s.books.map((b, bIdx) => `
                    <div class="book" style="position:relative;">
                        <img src="${b.cover}" style="width:100%; border-radius:4px;">
                        <button onclick="deleteBook(${sIdx}, ${bIdx})" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(shelfEl);
    });
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.innerText = shelves.reduce((acc, cur) => acc + cur.books.length, 0);
}

// 예스24 프록시 Worker URL 설정. API Key 자체는 절대 여기 저장하지 않고,
// Worker 환경변수에만 둔다. 배포 방법: tools/yes24-proxy/README.md
function configureYes24Proxy() {
    const current = localStorage.getItem(YES24_PROXY_KEY) || '';
    const input = prompt(
        '예스24 도서 검색을 쓰려면 Cloudflare Worker 프록시 URL이 필요합니다.\n' +
        '(예스24 Open API는 서버 인증 방식이라 브라우저에서 직접 호출할 수 없습니다.)\n' +
        '아직 Worker가 없다면 tools/yes24-proxy/README.md를 참고해 배포하세요.\n\n' +
        'Worker URL (예: https://yes24-proxy.내계정.workers.dev):',
        current
    );
    if (input === null) return; // 취소
    const url = input.trim().replace(/\/+$/, '');
    if (url) localStorage.setItem(YES24_PROXY_KEY, url);
    else localStorage.removeItem(YES24_PROXY_KEY);
    alert(url ? '저장되었습니다.' : '설정이 삭제되었습니다.');
}

async function searchByKeyword() {
    const kw = document.getElementById('kwInput').value;
    if (!kw) return;
    const results = document.getElementById('searchResults');

    const proxyUrl = (localStorage.getItem(YES24_PROXY_KEY) || '').trim().replace(/\/+$/, '');
    if (!proxyUrl) {
        results.innerHTML = '<p style="color:#ff4444;">예스24 프록시 Worker URL이 설정되지 않았습니다. configureYes24Proxy()로 등록해주세요.</p>';
        return;
    }

    // 예스24 Open API는 X-Api-Key 헤더 인증이라 브라우저가 직접 부를 수 없으므로,
    // 사용자가 배포한 Cloudflare Worker(프록시)를 거쳐 호출한다. Worker가 대신
    // X-Api-Key를 붙여 https://apis.yes24.com/v1/goods/itemList 를 호출해 준다.
    const params = new URLSearchParams({ query: kw, category: 'BOOK', pageSize: '15', detail: 'N' });
    const apiUrl = `${proxyUrl}/goods/itemList?${params.toString()}`;
    try {
        const response = await fetch(apiUrl);
        const body = await response.json();
        if (!body || body.success !== true) {
            throw new Error(body?.message || `HTTP ${response.status}`);
        }
        const items = (body.data && body.data.items) || [];
        results.innerHTML = '';
        items.forEach(i => {
            // 예스24 응답의 cover는 이미 큰 이미지 URL이라 별도 업그레이드가 필요 없다.
            const book = { title: (i.title || '').replace(/<[^>]*>?/gm, ''), cover: i.cover || '', author: i.author || '', addedDate: new Date().toLocaleDateString(), memo: "" };
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `<img src="${book.cover}">`;
            div.onclick = () => {
                if(shelves.length === 0) shelves.push({ title: 'MY COLLECTION', books: [], color: '#ffffff' });
                shelves[0].books.unshift(book);
                save(); render();
            };
            results.appendChild(div);
        });
    } catch (e) { console.error("검색 오류:", e.message); }
}

function addShelf() { shelves.push({ title: 'NEW STACK', books: [], color: hipColors[Math.floor(Math.random()*hipColors.length)] }); save(); render(); }
function deleteShelf(idx) { if(confirm("책장을 삭제할까요?")) { shelves.splice(idx, 1); save(); render(); } }
function deleteBook(sIdx, bIdx) { shelves[sIdx].books.splice(bIdx, 1); save(); render(); }
function toggleStats() { document.getElementById('statsBar').classList.toggle('collapsed'); }
function clearSearch() { document.getElementById('kwInput').value = ''; document.getElementById('searchResults').innerHTML = ''; }
