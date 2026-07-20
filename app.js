const STORAGE_KEY = "jbos-os-state-v2";

// ===== J-BOS Cloud (Supabase) =====
const SUPABASE_URL = "https://zyzcxuhxxtnwajlmqmsn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emN4dWh4eHRud2FqbG1xbXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mzc0MjMsImV4cCI6MjA5OTUxMzQyM30.rXFLYlyUfbd_lGfO7vfSG1H54Lqe-a0Y-PEKa7XmDyg";
const GOOGLE_INTEGRATION_SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly";
let sb = null;
let currentUser = null;
let cloudSaveTimer = null;
let cloudReady = false;
let marketAsOf = "";
let weatherAsOf = "";

const stages = [
  { id: "research", label: "리서치", file: "01_인기콘텐츠_리서치.md" },
  { id: "benchmark", label: "벤치마킹", file: "03_벤치마킹_분석.md" },
  { id: "copy", label: "제목·썸네일", file: "04_제목_썸네일_후보.md" },
  { id: "law", label: "법령 체크", file: "06_제작일기준_법령체크.md" },
  { id: "script", label: "대본", file: "07_1차_대본.md" },
  { id: "review", label: "승인", file: "10_정엘_승인기록.md" },
  { id: "slides", label: "슬라이드", file: "11_슬라이드_구성안.md" },
  { id: "upload", label: "업로드", file: "15_업로드_패키지.md" },
  { id: "feedback", label: "피드백", file: "17_JBOS_업그레이드_메모.md" }
];

const projectChecklist = [
  "00_프로젝트_개요.md",
  "01_인기콘텐츠_리서치.md",
  "02_주제선정_근거.md",
  "03_벤치마킹_분석.md",
  "04_제목_썸네일_후보.md",
  "05_제목_썸네일_최종안.md",
  "06_제작일기준_법령체크.md",
  "07_1차_대본.md",
  "08_대본_법령검증.md",
  "09_판례_심판례_근거.md",
  "10_정엘_승인기록.md",
  "11_슬라이드_구성안.md",
  "12_슬라이드_노트용_대본.md",
  "13_영상화_체크리스트.md",
  "14_최종_썸네일_검증.md",
  "15_업로드_패키지.md",
  "16_송출후_피드백.md",
  "17_JBOS_업그레이드_메모.md"
];

const defaultVaultDocs = [
  {
    title: "AI에게 먼저 읽힐 문서",
    type: "index",
    path: "../J-BOS/00_INDEX/02_AI에게_먼저_읽힐_문서.md",
    summary: "AI가 J-BOS 업무 전 읽어야 할 핵심 문서 순서"
  },
  {
    title: "Master Rulebook 최신본",
    type: "rulebook",
    path: "../J-BOS/02_MASTER_RULEBOOK/00_Master_Rulebook_최신본.md",
    summary: "브랜드, 콘텐츠, 검증, 승인, 업그레이드 최상위 규칙"
  },
  {
    title: "콘텐츠 제작 전체흐름",
    type: "workflow",
    path: "../J-BOS/05_CONTENT_SYSTEM/00_콘텐츠_제작_전체흐름.md",
    summary: "리서치부터 송출 후 피드백까지 16단계 운영 흐름"
  },
  {
    title: "썸네일 시스템",
    type: "content",
    path: "../J-BOS/05_CONTENT_SYSTEM/03_썸네일_시스템.md",
    summary: "대상, 숫자, 이익, 방법을 기준으로 썸네일 카피 검증"
  },
  {
    title: "20분 대본 시스템",
    type: "script",
    path: "../J-BOS/05_CONTENT_SYSTEM/06_20분_대본_시스템.md",
    summary: "상담 유입 구조로 장편 대본을 구성하는 기준"
  },
  {
    title: "세법검증 전체흐름",
    type: "tax",
    path: "../J-BOS/06_TAX_RESEARCH/00_세법검증_전체흐름.md",
    summary: "제작일 기준 법령, 시행일, 예규, 질의회신 검토 절차"
  },
  {
    title: "판례검증 전체흐름",
    type: "case",
    path: "../J-BOS/07_CASELAW/00_판례검증_전체흐름.md",
    summary: "대법원 판례와 조세심판원 결정례를 주장과 연결"
  },
  {
    title: "품질평가표 템플릿",
    type: "template",
    path: "../J-BOS/09_TEMPLATES/07_품질평가표_템플릿.md",
    summary: "브랜드, 법령, 판례, CTA, 과장 표현 점검표"
  },
  {
    title: "Codex 실행프롬프트",
    type: "prompt",
    path: "../J-BOS/08_PROMPTS/01_Codex_실행프롬프트.md",
    summary: "콘텐츠 제작을 Codex에 맡길 때 쓰는 기본 프롬프트"
  },
  {
    title: "누락자료 및 다음 추가문서",
    type: "learning",
    path: "../J-BOS/00_INDEX/04_누락자료_및_다음추가문서.md",
    summary: "외부 검증과 추가 데이터가 필요한 항목"
  }
];

let vaultDocs = defaultVaultDocs;

const giftItems = [
  "승계 리스크 점검표",
  "대표 소득 구조 메모",
  "법령·판례 근거 묶음",
  "상담 전 질문지"
];

const workDefaults = {
  news: [
    {
      tag: "정책",
      title: "중소기업 지원사업과 규제 변화 모니터링",
      summary: "지원사업, 정책자금, 규제 혁신은 고객사 대표님 상담 소재와 콘텐츠 아이디어로 연결합니다.",
      source: "J-BOS",
      time: "상시"
    },
    {
      tag: "법·금융",
      title: "세법·노무·금융 변화 체크",
      summary: "콘텐츠화 전 반드시 J-BOS 세법검증 흐름과 판례검증 흐름으로 확인합니다.",
      source: "J-BOS",
      time: "제작일 기준"
    },
    {
      tag: "중소기업",
      title: "기업 오너가 바로 반응하는 손실·이익 질문 수집",
      summary: "댓글, 상담, 뉴스에서 반복되는 질문을 콘텐츠 파이프라인으로 보냅니다.",
      source: "정엘 업무허브",
      time: "매일"
    },
    {
      tag: "글로벌",
      title: "금리·환율·유가 변화와 법인 의사결정",
      summary: "시장 변동은 배당, 퇴직금, 지분 구조, 현금흐름 콘텐츠의 보조 근거로 사용합니다.",
      source: "경제 지표",
      time: "수동 업데이트"
    }
  ],
  economy: [
    { name: "KOSPI", value: "2,685.67", change: "▼ 1.7", trend: "down" },
    { name: "USD/KRW", value: "1,382.5", change: "▼ -0.38%", trend: "down" },
    { name: "금 (oz)", value: "$2,387", change: "▲ +0.52%", trend: "up" },
    { name: "WTI 유가", value: "$77.84", change: "▼ -0.79%", trend: "down" },
    { name: "한국 기준금리", value: "3.25%", change: "동결", trend: "flat" },
    { name: "미국 기준금리", value: "5.25~5.50%", change: "동결", trend: "flat" }
  ],
  stocks: [
    {
      rank: 1,
      code: "005930",
      name: "삼성전자",
      value: "285,000원",
      change: "+7,000 (+2.52%)",
      trend: "up",
      meta: "KOSPI 시총 1위",
      source: "Npay 증권 2026.07.10 장마감",
      url: "https://finance.naver.com/item/main.naver?code=005930"
    },
    {
      rank: 2,
      code: "000660",
      name: "SK하이닉스",
      value: "2,180,000원",
      change: "-6,000 (-0.27%)",
      trend: "down",
      meta: "KOSPI 시총 2위",
      source: "Npay 증권 2026.07.10 장마감",
      url: "https://finance.naver.com/item/main.naver?code=000660"
    },
    {
      rank: 3,
      code: "402340",
      name: "SK스퀘어",
      value: "1,409,000원",
      change: "+82,000 (+6.18%)",
      trend: "up",
      meta: "KOSPI 시총 3위",
      source: "Npay 증권 2026.07.10 장마감",
      url: "https://finance.naver.com/item/main.naver?code=402340"
    },
    {
      rank: 4,
      code: "005935",
      name: "삼성전자우",
      value: "194,300원",
      change: "+8,700 (+4.69%)",
      trend: "up",
      meta: "KOSPI 시총 4위",
      source: "Npay 증권 2026.07.10 장마감",
      url: "https://finance.naver.com/item/main.naver?code=005935"
    },
    {
      rank: 5,
      code: "009150",
      name: "삼성전기",
      value: "1,584,000원",
      change: "+91,000 (+6.10%)",
      trend: "up",
      meta: "KOSPI 시총 5위",
      source: "Npay 증권 2026.07.10 장마감",
      url: "https://finance.naver.com/item/main.naver?code=009150"
    }
  ],
  weather: {
    city: "서울",
    temp: "28°C",
    condition: "맑음",
    humidity: "62%",
    note: "외부 일정과 촬영 컨디션 확인용"
  },
  events: [],
  emails: [
    {
      id: "mail-guide",
      sender: "J-BOS",
      subject: "Gmail 자동 연동 대기 중",
      preview: "로그아웃 후 '구글로 로그인'을 다시 눌러 권한 동의 화면까지 완료하면 실제 Gmail 받은편지함이 여기에 표시됩니다.",
      tag: "안내",
      time: "예정"
    }
  ],
  integrations: {
    gmail: {
      connected: false,
      inboxTotal: 0,
      inboxUnread: 0,
      importantUnread: 0,
      lastSynced: ""
    },
    calendar: {
      connected: false,
      account: "",
      accountName: "",
      primaryCalendarId: "",
      syncStatus: "",
      sources: [],
      lastSynced: ""
    }
  },
  files: [
    { id: "file-1", name: "정엘_브랜드_참조가이드.md", folder: "브랜드", date: toISODate(new Date()) },
    { id: "file-2", name: "품질평가표_템플릿.md", folder: "J-BOS", date: toISODate(new Date()) },
    { id: "file-3", name: "업로드_패키지_템플릿.md", folder: "콘텐츠", date: toISODate(new Date()) }
  ],
  automations: [
    { id: "auto-1", name: "일일 경제 지표 확인", schedule: "매일 09:00", active: true },
    { id: "auto-2", name: "주간 뉴스·정책 소재 정리", schedule: "매주 금요일", active: true },
    { id: "auto-3", name: "콘텐츠 승인 전 법령 검증 리마인더", schedule: "프로젝트 승인 전", active: true },
    { id: "auto-4", name: "송출 후 J-BOS 업그레이드 메모", schedule: "업로드 후 48시간", active: false }
  ]
};

const today = new Date();
const todayISO = toISODate(today);

const sampleState = {
  version: 1,
  ui: {
    activeView: "dashboard",
    stageFilter: "all",
    selectedProjectId: "p1",
    search: ""
  },
  projects: [
    {
      id: "p1",
      title: "법인돈 10억, 안전하게 개인화하는 구조",
      audience: "법인 대표, 오너 일가",
      stage: "law",
      priority: "high",
      dueDate: offsetDate(2),
      owner: "정엘",
      nextAction: "제작일 기준 법령과 조세심판원 결정례 확인",
      thumbnail: "법인돈 10억, 가장 안전하게 가져오는 순서",
      offer: "법인자금 개인화 리스크 점검표",
      notes: "세율 단정 전 법령과 판례 근거를 먼저 확보한다.",
      checklist: [
        "00_프로젝트_개요.md",
        "01_인기콘텐츠_리서치.md",
        "03_벤치마킹_분석.md",
        "04_제목_썸네일_후보.md"
      ]
    },
    {
      id: "p2",
      title: "대표 퇴직금 10억 설계와 세금 리스크",
      audience: "중소기업 대표",
      stage: "script",
      priority: "normal",
      dueDate: offsetDate(5),
      owner: "정엘",
      nextAction: "20분 대본 초안 작성 후 법령 검증표로 재검토",
      thumbnail: "퇴직금 10억, 세금 가장 적게 내는 구조",
      offer: "임원퇴직금 규정 체크리스트",
      notes: "정관, 임원퇴직금 규정, 지급 배율 쟁점 분리.",
      checklist: [
        "00_프로젝트_개요.md",
        "01_인기콘텐츠_리서치.md",
        "02_주제선정_근거.md",
        "03_벤치마킹_분석.md",
        "04_제목_썸네일_후보.md",
        "06_제작일기준_법령체크.md"
      ]
    },
    {
      id: "p3",
      title: "가업승계 전 지분 구조를 먼저 봐야 하는 이유",
      audience: "승계 준비 오너 일가",
      stage: "research",
      priority: "low",
      dueDate: offsetDate(9),
      owner: "정엘",
      nextAction: "정엘 채널 내부 인기영상 댓글 질문 정리",
      thumbnail: "상속세 20억 줄이는 지분 구조",
      offer: "가업승계 사전진단 질문지",
      notes: "고객사 선물용 샘플 프로젝트로도 활용 가능.",
      checklist: ["00_프로젝트_개요.md"]
    }
  ],
  tasks: [
    {
      id: "t1",
      text: "법인돈 개인화 주제 관련 법령 원문 링크 정리",
      projectId: "p1",
      priority: "high",
      dueDate: todayISO,
      done: false
    },
    {
      id: "t2",
      text: "퇴직금 대본의 보장 표현 제거",
      projectId: "p2",
      priority: "normal",
      dueDate: offsetDate(1),
      done: false
    },
    {
      id: "t3",
      text: "J-BOS Vault 읽기 순서 고객사용 문구로 다듬기",
      projectId: "",
      priority: "low",
      dueDate: offsetDate(4),
      done: false
    },
    {
      id: "t4",
      text: "썸네일 공식 문서 확인",
      projectId: "p1",
      priority: "normal",
      dueDate: offsetDate(-1),
      done: true
    }
  ],
  clients: [
    {
      id: "c1",
      name: "샘플 제조업 대표님",
      stage: "초기 상담",
      nextContact: offsetDate(3),
      memo: "지분 구조와 임원퇴직금 규정 점검 필요",
      gifts: ["승계 리스크 점검표"]
    },
    {
      id: "c2",
      name: "샘플 유통업 고객사",
      stage: "자료 준비",
      nextContact: offsetDate(7),
      memo: "대표 소득 구조 설명자료 선호",
      gifts: ["대표 소득 구조 메모", "상담 전 질문지"]
    }
  ]
};

const defaultState = {
  version: 2,
  mode: "local",
  ui: {
    activeView: "dashboard",
    stageFilter: "all",
    selectedProjectId: "",
    search: "",
    workFocus: "",
    taskFilter: "",
    moduleVisibility: {
      news: true,
      economy: true,
      weather: true,
      calendar: true,
      email: true,
      files: true,
      automation: true
    }
  },
  projects: [],
  tasks: [],
  clients: [],
  news: workDefaults.news,
  economy: workDefaults.economy,
  stocks: workDefaults.stocks,
  weather: workDefaults.weather,
  events: workDefaults.events,
  emails: workDefaults.emails,
  integrations: workDefaults.integrations,
  files: workDefaults.files,
  automations: workDefaults.automations
};

let backend = {
  connected: false,
  connecting: false,
  health: null
};

let state = loadState();
let toastTimer;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initializeControls();
  render();
  initCloud();
  registerServiceWorker();
});

function cacheElements() {
  [
    "todayLabel",
    "viewTitle",
    "connectionStatus",
    "globalSearch",
    "metricGrid",
    "dashboardNewsList",
    "dashboardWeatherBox",
    "dashboardEconomyList",
    "dashboardCalendarCount",
    "dashboardCalendarList",
    "dashboardEmailCount",
    "dashboardEmailReport",
    "dashboardReminderList",
    "focusList",
    "stageSummary",
    "dashboardProjects",
    "docShortcuts",
    "workMetricGrid",
    "workFocusBar",
    "workFocusLabel",
    "workGrid",
    "workNewsList",
    "workWeatherBox",
    "workEconomyList",
    "workEventCount",
    "eventForm",
    "workEventsList",
    "workEmailCount",
    "workEmailList",
    "fileForm",
    "workFilesList",
    "workAutomationList",
    "stageFilters",
    "projectList",
    "projectDetail",
    "taskForm",
    "taskFocusBar",
    "taskFocusLabel",
    "taskProjectSelect",
    "todayTasks",
    "upcomingTasks",
    "doneTasks",
    "vaultCount",
    "vaultList",
    "copyReadOrderBtn",
    "promptType",
    "promptTopic",
    "promptDate",
    "promptProject",
    "generatePromptBtn",
    "copyPromptBtn",
    "promptOutput",
    "clientForm",
    "clientGrid",
    "projectDialog",
    "projectForm",
    "dialogTitle",
    "projectStageSelect",
    "deleteProjectBtn",
    "newProjectBtn",
    "closeDialogBtn",
    "cancelProjectBtn",
    "exportBtn",
    "importBtn",
    "importFile",
    "toast",
    "quickPromptBtn",
    "moduleSettingsBtn",
    "moduleSettingsOverlay",
    "moduleSettingsForm",
    "closeModuleSettingsBtn"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function initializeControls() {
  els.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full"
  }).format(today);
  els.promptDate.value = todayISO;

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  els.globalSearch.addEventListener("input", (event) => {
    state.ui.search = event.target.value.trim();
    saveState();
    renderCurrentView();
  });

  els.newProjectBtn.addEventListener("click", () => openProjectDialog());
  els.quickPromptBtn.addEventListener("click", () => {
    setView("prompts");
    generatePrompt();
  });
  els.closeDialogBtn.addEventListener("click", () => els.projectDialog.close());
  els.cancelProjectBtn.addEventListener("click", () => els.projectDialog.close());
  els.deleteProjectBtn.addEventListener("click", deleteProjectFromDialog);
  els.projectForm.addEventListener("submit", saveProjectFromDialog);

  els.taskForm.addEventListener("submit", addTask);
  els.clientForm.addEventListener("submit", addClient);
  if (els.eventForm) els.eventForm.addEventListener("submit", addWorkEvent);
  if (els.fileForm) els.fileForm.addEventListener("submit", addWorkFile);

  els.generatePromptBtn.addEventListener("click", generatePrompt);
  els.copyPromptBtn.addEventListener("click", () => copyText(els.promptOutput.value, "프롬프트를 복사했습니다."));
  els.copyReadOrderBtn.addEventListener("click", copyReadOrder);

  els.exportBtn.addEventListener("click", exportState);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importState);

  bindModuleSettingsUi();

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("change", handleDocumentChange);
  document.addEventListener("keydown", handleDocumentKeydown);

  stages.forEach((stage) => {
    const option = new Option(stage.label, stage.id);
    els.projectStageSelect.add(option);
  });
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredCloneSafe(defaultState);
    const parsed = JSON.parse(stored);
    if (!parsed.version || parsed.version < 2) return structuredCloneSafe(defaultState);
    return {
      ...structuredCloneSafe(defaultState),
      ...parsed,
      ui: { ...defaultState.ui, ...(parsed.ui || {}) },
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      clients: Array.isArray(parsed.clients) ? parsed.clients : []
    };
  } catch (error) {
    console.warn(error);
    return structuredCloneSafe(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}

function persistableState() {
  const copy = structuredCloneSafe(state);
  delete copy.economy;
  delete copy.stocks;
  delete copy.weather;
  return copy;
}

function scheduleCloudSave() {
  if (!sb || !currentUser) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(async () => {
    try {
      const { error } = await sb.from("jbos_state").upsert({
        user_id: currentUser.id,
        state: persistableState(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setConnectionStatus(`클라우드 동기화됨 · ${currentUser.email}`, "connected");
    } catch (error) {
      console.warn("cloud save failed", error);
      setConnectionStatus("동기화 실패 · 브라우저 저장 유지", "local");
    }
  }, 1000);
}

function initCloud() {
  if (!window.supabase || SUPABASE_URL.startsWith("__")) {
    setConnectionStatus("브라우저 저장 모드", "local");
    return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  bindAuthUi();

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      showAuthOverlay();
      if (window.jbosApplyAuthMode) window.jbosApplyAuthMode("recovery");
      return;
    }
    if (session?.user) {
      currentUser = session.user;
      hideAuthOverlay();
      backend.connected = true;
      setConnectionStatus(`클라우드 연결됨 · ${currentUser.email}`, "connected");
      await loadCloudState();
      if (session.provider_refresh_token) {
        storeGoogleRefreshToken(session.provider_refresh_token, GOOGLE_INTEGRATION_SCOPES);
      }
      refreshLiveData();
      ensureProfile();
    } else {
      currentUser = null;
      backend.connected = false;
      showAuthOverlay();
      setConnectionStatus("로그인 필요", "local");
      refreshLiveData();
    }
  });
}

function bindAuthUi() {
  const form = document.getElementById("authForm");
  const toggle = document.getElementById("authToggle");
  const logoutBtn = document.getElementById("logoutBtn");
  const googleBtn = document.getElementById("googleBtn");
  const resetBtn = document.getElementById("resetBtn");
  const extra = document.getElementById("authExtra");
  const emailLabel = document.getElementById("authEmailLabel");
  const pwToggle = document.getElementById("pwToggle");
  if (pwToggle && form) {
    pwToggle.addEventListener("click", () => {
      const input = form.elements.password;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      const eye = pwToggle.querySelector(".pw-eye");
      const eyeOff = pwToggle.querySelector(".pw-eye-off");
      if (eye) eye.hidden = show;
      if (eyeOff) eyeOff.hidden = !show;
      pwToggle.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 표시");
      pwToggle.setAttribute("title", show ? "비밀번호 숨기기" : "비밀번호 표시");
    });
  }
  let mode = "signin";

  function applyMode(next) {
    mode = next;
    const titles = { signin: "로그인", signup: "회원가입", recovery: "새 비밀번호 설정" };
    const submits = { signin: "로그인", signup: "가입하기", recovery: "비밀번호 변경" };
    document.getElementById("authTitle").textContent = titles[mode] || "로그인";
    document.getElementById("authSubmit").textContent = submits[mode] || "로그인";
    if (extra) {
      extra.hidden = mode !== "signup";
      ["name", "phone", "company"].forEach((field) => {
        if (form && form.elements[field]) form.elements[field].required = mode === "signup";
      });
    }
    if (emailLabel) emailLabel.hidden = mode === "recovery";
    if (form && form.elements.email) form.elements.email.required = mode !== "recovery";
    if (googleBtn) googleBtn.hidden = mode === "recovery";
    if (toggle) toggle.textContent = mode === "signin" ? "처음이신가요? 회원가입" : "이미 계정이 있어요. 로그인";
    setAuthMsg("");
  }
  window.jbosApplyAuthMode = applyMode;

  if (toggle) {
    toggle.addEventListener("click", () => applyMode(mode === "signin" ? "signup" : "signin"));
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      setAuthMsg("구글 로그인으로 이동합니다...");
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          scopes: GOOGLE_INTEGRATION_SCOPES,
          queryParams: { access_type: "offline", prompt: "consent" }
        }
      });
      if (error) setAuthMsg(koreanAuthError(error));
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const email = (form && form.elements.email.value || "").trim();
      if (!email) {
        setAuthMsg("가입한 이메일을 위 칸에 입력한 뒤 다시 눌러주세요.");
        return;
      }
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      setAuthMsg(error ? koreanAuthError(error) : "재설정 메일을 보냈습니다. 메일함을 확인해주세요.");
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = (form.elements.email.value || "").trim();
      const password = form.elements.password.value;
      setAuthMsg("처리 중...");
      try {
        if (mode === "recovery") {
          const { error } = await sb.auth.updateUser({ password });
          if (error) throw error;
          setAuthMsg("");
          showToast("비밀번호를 변경했습니다.");
          applyMode("signin");
          hideAuthOverlay();
        } else if (mode === "signin") {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setAuthMsg("");
        } else {
          const meta = {
            name: ((form.elements.name && form.elements.name.value) || "").trim(),
            phone: ((form.elements.phone && form.elements.phone.value) || "").trim(),
            company: ((form.elements.company && form.elements.company.value) || "").trim()
          };
          if (!meta.name || !meta.phone || !meta.company) {
            setAuthMsg("이름, 핸드폰 번호, 회사명을 모두 입력해주세요.");
            return;
          }
          const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
          if (error) throw error;
          if (!data.session) {
            setAuthMsg("가입 확인 메일을 보냈습니다. 메일함에서 확인 후 로그인하세요.");
            return;
          }
          setAuthMsg("");
        }
      } catch (error) {
        console.warn(error);
        setAuthMsg(koreanAuthError(error));
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await sb.auth.signOut();
      showToast("로그아웃했습니다.");
    });
  }
}

async function ensureProfile() {
  if (!sb || !currentUser) return;
  try {
    const { data } = await sb
      .from("jbos_profiles")
      .select("name, phone, company")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    const meta = currentUser.user_metadata || {};
    const merged = {
      name: ((data && data.name) || meta.name || meta.full_name || "").trim(),
      phone: ((data && data.phone) || meta.phone || "").trim(),
      company: ((data && data.company) || meta.company || "").trim()
    };
    if (merged.name && merged.phone && merged.company) {
      if (!data || !data.name || !data.phone || !data.company) await saveProfile(merged);
      return;
    }
    showProfileOverlay(merged);
  } catch (error) {
    console.warn("profile check failed", error);
  }
}

async function saveProfile(values) {
  const { error } = await sb.from("jbos_profiles").upsert({
    user_id: currentUser.id,
    email: currentUser.email,
    name: values.name,
    phone: values.phone,
    company: values.company,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

function showProfileOverlay(prefill) {
  const overlay = document.getElementById("profileOverlay");
  const form = document.getElementById("profileForm");
  if (!overlay || !form) return;
  form.elements.name.value = prefill.name || "";
  form.elements.phone.value = prefill.phone || "";
  form.elements.company.value = prefill.company || "";
  overlay.hidden = false;
  if (!form.dataset.bound) {
    form.dataset.bound = "1";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveProfile({
          name: form.elements.name.value.trim(),
          phone: form.elements.phone.value.trim(),
          company: form.elements.company.value.trim()
        });
        overlay.hidden = true;
        showToast("프로필을 저장했습니다. 환영합니다!");
      } catch (error) {
        console.warn(error);
        showToast("프로필 저장에 실패했습니다. 다시 시도해주세요.");
      }
    });
  }
}

function koreanAuthError(error) {
  const msg = String(error?.message || error || "");
  if (msg.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (msg.includes("Email not confirmed")) return "가입 확인 메일을 먼저 확인해주세요.";
  if (msg.includes("already registered")) return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (msg.includes("at least 6")) return "비밀번호는 6자 이상이어야 합니다.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

function setAuthMsg(text) {
  const el = document.getElementById("authMsg");
  if (el) el.textContent = text;
}

function showAuthOverlay() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.hidden = false;
}

function hideAuthOverlay() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.hidden = true;
}

async function loadCloudState() {
  try {
    const { data, error } = await sb
      .from("jbos_state")
      .select("state, updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (error) throw error;

    if (data?.state && (Array.isArray(data.state.projects) || Array.isArray(data.state.tasks))) {
      state = normalizeState(data.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
      showToast("클라우드 데이터를 불러왔습니다.");
    } else {
      // 첫 로그인: 이 브라우저의 데이터를 클라우드로 올린다.
      scheduleCloudSave();
    }
  } catch (error) {
    console.warn("cloud load failed", error);
    setConnectionStatus("클라우드 불러오기 실패 · 브라우저 저장 모드", "local");
  }
}

// ===== 실시간 지표 · 날씨 =====
async function refreshLiveData() {
  fetchLiveMarket();
  fetchLiveWeather();
  if (currentUser) {
    fetchLiveCalendar();
    fetchLiveGmail();
  }
}

// ===== 구글 캘린더 · Gmail 실연동 =====
async function getSupabaseAccessToken() {
  if (!sb) return "";
  const { data } = await sb.auth.getSession();
  return data?.session?.access_token || "";
}

async function storeGoogleRefreshToken(refreshToken, scope) {
  try {
    const accessToken = await getSupabaseAccessToken();
    if (!accessToken) return;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-store-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refresh_token: refreshToken, scope })
    });
    if (response.ok) {
      showToast("구글 캘린더·Gmail 연동 정보를 저장했습니다.");
    }
  } catch (error) {
    console.warn("google token store failed", error);
  }
}

async function fetchLiveCalendar() {
  try {
    const accessToken = await getSupabaseAccessToken();
    if (!accessToken) return;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
    const payload = await response.json();
    state.integrations = state.integrations || structuredCloneSafe(workDefaults.integrations);
    if (payload.connected) {
      state.integrations.calendar = {
        connected: true,
        syncStatus: "ok",
        sources: ["Google Calendar"],
        lastSynced: new Date().toISOString()
      };
      state.events = payload.events || [];
      renderCurrentView();
    } else {
      state.integrations.calendar = {
        ...(state.integrations.calendar || {}),
        connected: false,
        syncStatus: payload.needsSetup ? "needs_setup" : "needs_consent"
      };
    }
  } catch (error) {
    console.warn("calendar fetch failed", error);
  }
}

async function fetchLiveGmail() {
  try {
    const accessToken = await getSupabaseAccessToken();
    if (!accessToken) return;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-gmail`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
    const payload = await response.json();
    state.integrations = state.integrations || structuredCloneSafe(workDefaults.integrations);
    if (payload.connected) {
      state.integrations.gmail = {
        connected: true,
        inboxTotal: payload.inboxTotal || 0,
        inboxUnread: payload.inboxUnread || 0,
        importantUnread: payload.importantUnread || 0,
        mustReadCount: payload.mustReadCount || 0,
        adCount: payload.adCount || 0,
        briefing: payload.briefing || "",
        lastSynced: new Date().toISOString()
      };
      if (payload.emails && payload.emails.length) {
        state.emails = payload.emails;
      }
      renderCurrentView();
    } else {
      state.integrations.gmail = {
        ...(state.integrations.gmail || {}),
        connected: false
      };
    }
  } catch (error) {
    console.warn("gmail fetch failed", error);
  }
}

async function fetchLiveMarket() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/market`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (Array.isArray(payload.economy) && payload.economy.length) {
      state.economy = payload.economy;
      state.stocks = Array.isArray(payload.stocks) ? payload.stocks : [];
      marketAsOf = payload.asOf || "";
      renderCurrentView();
    }
  } catch (error) {
    console.warn("market fetch failed", error);
  }
}

const WEATHER_CODES = {
  0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림",
  45: "안개", 48: "짙은 안개",
  51: "이슬비", 53: "이슬비", 55: "이슬비",
  61: "비", 63: "비", 65: "강한 비",
  66: "얼음비", 67: "얼음비",
  71: "눈", 73: "눈", 75: "폭설", 77: "진눈깨비",
  80: "소나기", 81: "소나기", 82: "강한 소나기",
  85: "눈발", 86: "강한 눈발",
  95: "뇌우", 96: "뇌우·우박", 99: "강한 뇌우"
};

async function fetchLiveWeather() {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.978&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const cur = payload.current;
    if (cur) {
      state.weather = {
        city: "서울",
        temp: `${Math.round(cur.temperature_2m)}°C`,
        condition: WEATHER_CODES[cur.weather_code] || "확인",
        humidity: `${cur.relative_humidity_2m}%`,
        note: `Open-Meteo 실시간 · ${String(cur.time || "").replace("T", " ")} 기준`
      };
      weatherAsOf = cur.time || "";
      renderCurrentView();
    }
  } catch (error) {
    console.warn("weather fetch failed", error);
  }
}

setInterval(() => refreshLiveData(), 10 * 60 * 1000);

function normalizeState(nextState) {
  return {
    ...structuredCloneSafe(defaultState),
    ...nextState,
    ui: { ...defaultState.ui, ...(nextState.ui || {}) },
    projects: Array.isArray(nextState.projects) ? nextState.projects : [],
    tasks: Array.isArray(nextState.tasks) ? nextState.tasks : [],
    clients: Array.isArray(nextState.clients) ? nextState.clients : []
  };
}

function setConnectionStatus(text, mode) {
  if (!els.connectionStatus) return;
  els.connectionStatus.textContent = text;
  els.connectionStatus.classList.toggle("is-connected", mode === "connected");
  els.connectionStatus.classList.toggle("is-local", mode === "local");
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Service worker is optional.
    });
  });
}

function render() {
  ensureSelectedProject();
  renderNav();
  renderSelects();
  renderStageFilters();
  renderCurrentView();
}

function renderCurrentView() {
  const view = state.ui.activeView || "dashboard";
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("is-visible", section.id === `${view}View`);
  });

  const titles = {
    dashboard: "대시보드",
    work: "정엘 BOS 업무허브",
    pipeline: "콘텐츠 파이프라인",
    tasks: "할 일",
    vault: "J-BOS Vault",
    prompts: "프롬프트 스튜디오",
    clients: "고객사 선물 보드"
  };
  els.viewTitle.textContent = titles[view] || "대시보드";

  renderNav();
  resetHiddenFocusBars(view);
  if (view === "dashboard") renderDashboard();
  if (view === "work") renderWork();
  if (view === "pipeline") renderPipeline();
  if (view === "tasks") renderTasks();
  if (view === "vault") renderVault();
  if (view === "prompts") renderPrompts();
  if (view === "clients") renderClients();
}

function resetHiddenFocusBars(view) {
  if (view !== "work" && els.workFocusBar) {
    els.workFocusBar.hidden = true;
    if (els.workMetricGrid) els.workMetricGrid.hidden = false;
    if (els.workGrid) els.workGrid.classList.remove("is-focused");
    document.querySelectorAll("[data-work-module]").forEach((panel) => {
      panel.classList.remove("is-focused");
    });
  }

  if (view !== "tasks" && els.taskFocusBar) {
    els.taskFocusBar.hidden = true;
  }
}

function setView(view, options = {}) {
  state.ui.activeView = view;
  if (view === "work") {
    state.ui.workFocus = Object.hasOwn(options, "workFocus") ? options.workFocus : "";
  } else {
    state.ui.workFocus = "";
  }

  if (view === "tasks") {
    state.ui.taskFilter = Object.hasOwn(options, "taskFilter") ? options.taskFilter : "";
  } else {
    state.ui.taskFilter = "";
  }

  saveState();
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: "instant" });
  const workspace = document.querySelector(".workspace");
  if (workspace) workspace.scrollTop = 0;
}

function renderNav() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.ui.activeView);
  });
}

function renderSelects() {
  const projectOptions = [
    `<option value="">프로젝트 없음</option>`,
    ...state.projects.map((project) => `<option value="${h(project.id)}">${h(project.title)}</option>`)
  ].join("");

  els.taskProjectSelect.innerHTML = projectOptions;
  els.promptProject.innerHTML = projectOptions;
}

function renderStageFilters() {
  const buttons = [
    { id: "all", label: "전체" },
    ...stages
  ];
  els.stageFilters.innerHTML = buttons
    .map((stage) => {
      const active = (state.ui.stageFilter || "all") === stage.id ? " is-active" : "";
      return `<button class="segment-button${active}" data-stage-filter="${h(stage.id)}" type="button">${h(stage.label)}</button>`;
    })
    .join("");
}

function renderDashboard() {
  const openProjects = state.projects.filter((project) => project.stage !== "feedback").length;
  const urgentTasks = state.tasks.filter((task) => !task.done && task.priority === "high").length;
  const dueSoon = state.tasks.filter((task) => !task.done && isWithinDays(task.dueDate, 7)).length;
  const upcomingEvents = upcomingCalendarItems().length;
  const importantUnread = state.integrations?.gmail?.importantUnread || 0;
  const calendarNeedsSetup = needsCalendarSetup();
  const economyItems = state.economy || workDefaults.economy;
  const stockItems = state.stocks || workDefaults.stocks;

  els.metricGrid.innerHTML = [
    metric("뉴스피드", (state.news || []).length, "정책·세법·시장 이슈", "work", { workFocus: "news" }),
    metric("주요 메일", importantUnread || (state.emails || []).length, importantUnread ? "Gmail 중요 미확인" : "보고 대기 메일", "work", { workFocus: "email" }),
    metric("캘린더", calendarNeedsSetup ? "확인 필요" : upcomingEvents, calendarNeedsSetup ? "공유 캘린더 확인" : "이번 주 일정", "work", { workFocus: "calendar" }),
    metric("이번 주 할 일", dueSoon, "오늘부터 7일 안에 처리", "tasks", { taskFilter: "week" }),
    metric("긴급 항목", urgentTasks, "우선 확인 필요", "tasks", { taskFilter: "urgent" }),
    metric("진행 프로젝트", openProjects, "피드백 전 단계 기준", "pipeline"),
    metric("경제 지표", economyItems.length + stockItems.length, "지표 + KOSPI TOP 5", "work", { workFocus: "economy" }),
    metric("J-BOS 문서", vaultDocs.length, "운영 기준 문서", "vault")
  ].join("");

  els.dashboardNewsList.innerHTML = renderNewsCards((state.news || []).slice(0, 4));
  els.dashboardWeatherBox.innerHTML = renderWeatherCard(state.weather || workDefaults.weather);
  els.dashboardEconomyList.innerHTML = renderEconomySnapshot(economyItems.slice(0, 6), stockItems.slice(0, 5));
  els.dashboardCalendarCount.textContent = calendarNeedsSetup ? "확인 필요" : `${upcomingEvents}개`;
  els.dashboardCalendarList.innerHTML = renderEventList(upcomingCalendarItems().slice(0, 5), false);
  els.dashboardEmailCount.textContent = `${(state.emails || []).length}개`;
  els.dashboardEmailReport.innerHTML = renderEmailBriefing() + renderEmailList((state.emails || []).slice(0, 5));
  els.dashboardReminderList.innerHTML = renderReminderList();

  const focusItems = state.tasks
    .filter((task) => !task.done)
    .sort(sortTask)
    .slice(0, 5);
  els.focusList.innerHTML = focusItems.length
    ? focusItems.map(renderFocusItem).join("")
    : empty("오늘 처리할 일이 없습니다.");

  renderStageSummary();

  const topProjects = state.projects
    .slice()
    .sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage))
    .slice(0, 4);
  els.dashboardProjects.innerHTML = topProjects.length
    ? topProjects.map(renderProjectMini).join("")
    : empty("진행 중인 프로젝트가 없습니다.");

  els.docShortcuts.innerHTML = vaultDocs
    .slice(0, 5)
    .map((doc) => renderDocShortcut(doc))
    .join("");
}

function renderWork() {
  const activeAutos = (state.automations || []).filter((item) => item.active).length;
  const upcomingEvents = (state.events || []).filter((event) => isWithinDays(event.date, 7) || isTodayOrOverdue(event.date)).length;
  const unreadEmails = (state.emails || []).length;
  const fileCount = (state.files || []).length;
  const calendarNeedsSetup = needsCalendarSetup();
  const economyItems = state.economy || workDefaults.economy;
  const stockItems = state.stocks || workDefaults.stocks;

  const workMetrics = [
    { key: "news", node: metric("뉴스 소재", (state.news || []).length, "정책·법·금융·기업 오너 이슈", "work", { workFocus: "news" }) },
    { key: "economy", node: metric("경제 지표", economyItems.length + stockItems.length, "시장 지표 + 주요 주식", "work", { workFocus: "economy" }) },
    { key: "calendar", node: metric("이번 주 일정", calendarNeedsSetup ? "확인 필요" : upcomingEvents, calendarNeedsSetup ? "공유 캘린더 확인" : "상담·마감·촬영", "work", { workFocus: "calendar" }) },
    { key: "email", node: metric("이메일", unreadEmails, "확인할 업무 메일", "work", { workFocus: "email" }) },
    { key: "files", node: metric("파일", fileCount, "브랜드·법령·콘텐츠 자료", "work", { workFocus: "files" }) },
    { key: "automation", node: metric("자동화", activeAutos, "활성 운영 루틴", "work", { workFocus: "automation" }) }
  ];
  els.workMetricGrid.innerHTML = workMetrics
    .filter((item) => isModuleVisible(item.key))
    .map((item) => item.node)
    .join("") || empty("켜져 있는 항목이 없습니다. 화면 구성 설정(⚙)에서 항목을 켜주세요.");

  renderWorkFocus();

  els.workNewsList.innerHTML = renderNewsCards(state.news || [], true);

  els.workWeatherBox.innerHTML = renderWeatherCard(state.weather || workDefaults.weather);

  els.workEconomyList.innerHTML = renderEconomySnapshot(economyItems, stockItems);

  els.workEventCount.textContent = calendarNeedsSetup ? "확인 필요" : `${(state.events || []).length}개`;
  els.workEventsList.innerHTML = renderEventList(state.events || [], true);

  els.workEmailCount.textContent = `${(state.emails || []).length}개`;
  els.workEmailList.innerHTML = renderEmailBriefing() + renderEmailList(state.emails || []);

  els.workFilesList.innerHTML = (state.files || []).map((file) => `
    <article class="compact-item">
      <div class="compact-item-row">
        <main>
          <span>${h(file.folder || "업무")} · ${h(file.date || "")}</span>
          <strong>${h(file.name)}</strong>
        </main>
        <button class="mini-action" data-delete-file="${h(file.id)}" type="button">삭제</button>
      </div>
    </article>
  `).join("") || empty("파일 메모가 없습니다.");

  els.workAutomationList.innerHTML = (state.automations || []).map((automation) => `
    <article class="compact-item">
      <div class="compact-item-row">
        <main>
          <span>${h(automation.schedule)}</span>
          <strong>${h(automation.name)}</strong>
        </main>
        <button class="mini-action" data-toggle-automation="${h(automation.id)}" type="button">${automation.active ? "활성" : "중지"}</button>
      </div>
    </article>
  `).join("") || empty("자동화가 없습니다.");
}

function renderWorkFocus() {
  const focus = state.ui.workFocus || "";
  const labels = {
    news: "뉴스피드 전용 화면",
    economy: "경제 지표 전용 화면",
    calendar: "캘린더 전용 화면",
    email: "이메일 전용 화면",
    files: "파일 관리 전용 화면",
    automation: "반복 자동화 전용 화면",
    weather: "날씨 전용 화면"
  };

  els.workFocusBar.hidden = !focus;
  els.workFocusLabel.textContent = labels[focus] || "";
  els.workMetricGrid.hidden = Boolean(focus);
  els.workGrid.classList.toggle("is-focused", Boolean(focus));

  document.querySelectorAll("[data-work-module]").forEach((panel) => {
    const moduleKey = panel.dataset.workModule;
    const visible = isModuleVisible(moduleKey);
    panel.hidden = !visible;
    panel.classList.toggle("is-focused", visible && (!focus || moduleKey === focus));
  });
}

function isModuleVisible(key) {
  const visibility = state.ui.moduleVisibility || {};
  return visibility[key] !== false;
}

function bindModuleSettingsUi() {
  if (!els.moduleSettingsBtn || !els.moduleSettingsForm) return;

  const openOverlay = () => {
    const visibility = state.ui.moduleVisibility || {};
    Array.from(els.moduleSettingsForm.elements).forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = visibility[input.name] !== false;
      }
    });
    els.moduleSettingsOverlay.hidden = false;
  };

  const closeOverlay = () => {
    els.moduleSettingsOverlay.hidden = true;
  };

  els.moduleSettingsBtn.addEventListener("click", openOverlay);
  if (els.closeModuleSettingsBtn) {
    els.closeModuleSettingsBtn.addEventListener("click", closeOverlay);
  }
  els.moduleSettingsOverlay.addEventListener("click", (event) => {
    if (event.target === els.moduleSettingsOverlay) closeOverlay();
  });

  els.moduleSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.moduleSettingsForm);
    const nextVisibility = {};
    ["news", "economy", "weather", "calendar", "email", "files", "automation"].forEach((key) => {
      nextVisibility[key] = formData.get(key) === "on";
    });
    state.ui.moduleVisibility = nextVisibility;
    saveState();
    closeOverlay();
    renderCurrentView();
    showToast("화면 구성을 저장했습니다.");
  });
}

function renderNewsCards(items, withAction = false) {
  return items.map((item, index) => `
    <article class="news-card-lite">
      <span>${h(item.tag)} · ${h(item.source)} · ${h(item.time)}</span>
      <strong>${h(item.title)}</strong>
      <p>${h(item.summary)}</p>
      ${withAction ? `<button class="mini-action" data-news-task="${index}" type="button">할 일로 보내기</button>` : ""}
    </article>
  `).join("") || empty("뉴스 소재가 없습니다.");
}

function renderWeatherCard(weather) {
  return `
    <article class="weather-card">
      <span class="mini-label">${h(weather.city)}</span>
      <strong>${h(weather.temp)}</strong>
      <p>${h(weather.condition)} · 습도 ${h(weather.humidity)}</p>
      <p>${h(weather.note || "")}</p>
    </article>
  `;
}

function renderEconomyCards(items) {
  return items.map((item) => `
    <article class="indicator-card">
      <span>${h(item.name)}</span>
      <strong>${h(item.value)}</strong>
      <em class="${item.trend === "up" ? "up" : item.trend === "down" ? "down" : ""}">${h(item.change)}</em>
    </article>
  `).join("") || empty("경제 지표가 없습니다.");
}

function renderEconomySnapshot(economyItems, stockItems) {
  const economyCards = renderEconomyCards(economyItems);
  const stockCards = renderStockCards(stockItems);
  const liveLabel = marketAsOf
    ? `<span class="live-pill">실시간 · ${h(marketAsOf)} 기준</span>`
    : `<span class="live-pill is-loading">시세 불러오는 중...</span>`;
  return `
    <div class="indicator-section-title">시장 지표 ${liveLabel}</div>
    ${economyCards}
    <div class="indicator-section-title">국내 주요 종목</div>
    ${stockCards}
  `;
}

function renderStockCards(items) {
  return items.map((item) => {
    const trendClass = item.trend === "up" ? "up" : item.trend === "down" ? "down" : "";
    const body = `
      <span>${h(item.meta || `KOSPI ${item.rank || ""}위`)} · ${h(item.code || "")}</span>
      <strong>${h(item.name)}</strong>
      <p class="stock-price">${h(item.value)}</p>
      <em class="${trendClass}">${h(item.change)}</em>
      <small>${h(item.source || "")}</small>
    `;
    return item.url
      ? `<a class="indicator-card stock-card" href="${h(item.url)}" target="_blank" rel="noreferrer">${body}</a>`
      : `<article class="indicator-card stock-card">${body}</article>`;
  }).join("") || empty("주식 시세가 없습니다.");
}

function renderEventList(items, withDelete = false) {
  const syncNotice = needsCalendarSetup() ? renderCalendarSyncCard() : "";

  if (!items.length) {
    if (syncNotice) return syncNotice;
    return empty(state.integrations?.calendar?.connected ? "이번 주 Google Calendar 일정이 없습니다." : "등록된 일정이 없습니다. 위 양식으로 일정을 추가하세요. (구글 캘린더 연동은 곧 제공)");
  }

  return syncNotice + items
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((event) => `
      <article class="compact-item">
        <div class="compact-item-row">
          <main>
            <span>${h(formatDue(event.date))}${event.source ? ` · ${h(event.source)}` : ""}</span>
            <strong>${h(event.title)}</strong>
            ${event.time ? `<p>${h(event.time)}</p>` : ""}
          </main>
          ${withDelete ? `<button class="mini-action" data-delete-event="${h(event.id)}" type="button">삭제</button>` : ""}
        </div>
      </article>
    `).join("");
}

function renderCalendarSyncCard() {
  const status = state.integrations?.calendar?.syncStatus;
  const message = status === "needs_setup"
    ? "구글 캘린더 연동이 아직 준비되지 않았습니다. 관리자가 백엔드 설정을 완료하면 자동으로 연동됩니다."
    : "구글 캘린더 접근 권한이 없습니다. 로그아웃 후 '구글로 로그인'을 다시 누르면(권한 동의 화면 포함) 자동으로 연동됩니다.";
  return `
    <article class="calendar-sync-card">
      <div class="calendar-sync-head">
        <span>Google Calendar</span>
        <strong>연동 필요</strong>
      </div>
      <p>${h(message)}</p>
    </article>
  `;
}

function renderEmailBriefing() {
  const gmail = state.integrations?.gmail;
  if (!gmail?.connected || !gmail.briefing) return "";
  const mustRead = gmail.mustReadCount || 0;
  return `
    <article class="compact-item" style="border-left:3px solid ${mustRead > 0 ? "#b3261e" : "#1a7f37"};background:${mustRead > 0 ? "#fdf3f2" : "#f2faf4"};">
      <span>비서 브리핑 · Gmail 자동 분류</span>
      <strong>${mustRead > 0 ? "🔴" : "✅"} ${h(gmail.briefing)}</strong>
      <p>필수 메일이 목록 맨 위에 정렬되어 있습니다. 광고·홍보 메일은 자동으로 숨겼습니다.</p>
    </article>
  `;
}

function renderEmailList(items) {
  return items.map((mail) => `
    <article class="compact-item">
      <span>${h(mail.sender)} · ${h(mail.time)} · ${h(mail.tag || "업무")}</span>
      <strong>${h(mail.subject)}</strong>
      <p>${h(mail.preview)}</p>
      ${mail.url ? `<a class="mini-link" href="${h(mail.url)}" target="_blank" rel="noreferrer">Gmail 열기</a>` : ""}
    </article>
  `).join("") || empty("이메일 메모가 없습니다.");
}

function renderReminderList() {
  const taskReminders = state.tasks
    .filter((task) => !task.done)
    .sort(sortTask)
    .slice(0, 4)
    .map((task) => ({
      title: task.text,
      meta: `${formatDue(task.dueDate)} · ${task.priority === "high" ? "긴급" : "일반"}`
    }));

  const automationReminders = (state.automations || [])
    .filter((automation) => automation.active)
    .slice(0, 3)
    .map((automation) => ({
      title: automation.name,
      meta: automation.schedule
    }));

  const reminders = [...taskReminders, ...automationReminders].slice(0, 6);
  return reminders.map((item) => `
    <article class="compact-item">
      <span>${h(item.meta)}</span>
      <strong>${h(item.title)}</strong>
    </article>
  `).join("") || empty("등록된 리마인더가 없습니다.");
}

function upcomingCalendarItems() {
  return (state.events || []).filter((event) => isWithinDays(event.date, 7) || isTodayOrOverdue(event.date));
}

function needsCalendarSetup() {
  const status = state.integrations?.calendar?.syncStatus;
  return status === "needs_calendar_id" || status === "needs_consent" || status === "needs_setup";
}

function renderStageSummary() {
  const counts = stages.map((stage) => ({
    ...stage,
    count: state.projects.filter((project) => project.stage === stage.id).length
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));

  els.stageSummary.innerHTML = counts
    .map((stage) => {
      const width = Math.max(5, (stage.count / max) * 100);
      return `
        <div class="stage-row">
          <span>${h(stage.label)}</span>
          <div class="stage-track"><div class="stage-fill" style="width:${width}%"></div></div>
          <strong>${stage.count}</strong>
        </div>
      `;
    })
    .join("");
}

function renderPipeline() {
  renderStageFilters();

  const projects = filteredProjects();
  els.projectList.innerHTML = projects.length ? projects.map(renderProjectCard).join("") : empty("조건에 맞는 프로젝트가 없습니다.");

  const selected = getSelectedProject();
  els.projectDetail.innerHTML = selected ? renderProjectDetail(selected) : empty("프로젝트를 선택하세요.");
}

function filteredProjects() {
  const query = normalizedSearch();
  const stage = state.ui.stageFilter || "all";
  return state.projects
    .filter((project) => stage === "all" || project.stage === stage)
    .filter((project) => !query || projectText(project).includes(query))
    .sort((a, b) => {
      if (a.priority !== b.priority) return priorityWeight(a.priority) - priorityWeight(b.priority);
      return new Date(a.dueDate || "2999-12-31") - new Date(b.dueDate || "2999-12-31");
    });
}

function renderProjectCard(project) {
  const selected = project.id === state.ui.selectedProjectId ? " is-selected" : "";
  const progress = projectProgress(project);
  return `
    <article class="project-card${selected}" data-project-card="${h(project.id)}">
      <div class="project-card-head">
        <div>
          <h3>${h(project.title)}</h3>
          <div class="project-meta">
            ${stagePill(project.stage)}
            ${priorityPill(project.priority)}
            <span class="pill">${h(formatDue(project.dueDate))}</span>
            ${currentUser ? '<span class="stage-pill">클라우드 저장</span>' : '<span class="pill">브라우저 저장</span>'}
          </div>
        </div>
        <button class="icon-button" data-edit-project="${h(project.id)}" type="button" title="수정">✎</button>
      </div>
      <p>${h(project.nextAction || "다음 액션 미정")}</p>
      <div class="progress-wrap">
        <div class="progress-top">
          <span>완성도</span>
          <strong>${progress}%</strong>
        </div>
        <div class="progress-bar"><span style="width:${progress}%"></span></div>
      </div>
      <div class="project-actions">
        <select data-stage-select="${h(project.id)}" aria-label="단계 변경">
          ${stages.map((stage) => `<option value="${h(stage.id)}"${stage.id === project.stage ? " selected" : ""}>${h(stage.label)}</option>`).join("")}
        </select>
        <button class="secondary-button" data-select-project="${h(project.id)}" type="button">상세</button>
        <button class="secondary-button" data-project-prompt="${h(project.id)}" type="button">프롬프트</button>
      </div>
    </article>
  `;
}

function renderProjectDetail(project) {
  return `
    <div>
      <span class="mini-label">선택 프로젝트</span>
      <h3>${h(project.title)}</h3>
      <p>${h(project.notes || "메모 없음")}</p>
      <div class="project-meta">
        ${stagePill(project.stage)}
        ${priorityPill(project.priority)}
        <span class="pill">${h(project.audience || "타깃 미정")}</span>
      </div>
      <p><strong>다음 액션</strong><br>${h(project.nextAction || "다음 액션 미정")}</p>
      <p><strong>썸네일 가설</strong><br>${h(project.thumbnail || "미정")}</p>
      <p><strong>오퍼</strong><br>${h(project.offer || "미정")}</p>
      ${project.overviewUrl ? `<p><strong>Vault 문서</strong><br><a href="${h(project.overviewUrl)}" target="_blank" rel="noreferrer">00_프로젝트_개요.md 열기</a></p>` : ""}
      <div class="checklist">
        ${projectChecklist.map((item) => {
          const checked = (project.checklist || []).includes(item);
          return `
            <label class="check-row">
              <input type="checkbox" data-project-check="${h(project.id)}" data-check-item="${h(item)}"${checked ? " checked" : ""}>
              <span>${h(item)}</span>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderTasks() {
  renderSelects();
  const query = normalizedSearch();
  const filter = state.ui.taskFilter || "";
  els.taskFocusBar.hidden = !filter;
  els.taskFocusLabel.textContent = filter === "week" ? "이번 주 할 일만 보기" : filter === "urgent" ? "긴급 항목만 보기" : "";

  const tasks = state.tasks.filter((task) => {
    if (query && !taskText(task).includes(query)) return false;
    if (filter === "week") return !task.done && isWithinDays(task.dueDate, 7);
    if (filter === "urgent") return !task.done && task.priority === "high";
    return true;
  });
  const activeTasks = tasks.filter((task) => !task.done).sort(sortTask);

  const todayTasks = activeTasks.filter((task) => isTodayOrOverdue(task.dueDate));
  const upcomingTasks = activeTasks.filter((task) => !isTodayOrOverdue(task.dueDate));
  const doneTasks = tasks.filter((task) => task.done).sort(sortTask).slice(0, 12);

  els.todayTasks.innerHTML = todayTasks.length ? todayTasks.map(renderTaskItem).join("") : empty("오늘 칸이 비었습니다.");
  els.upcomingTasks.innerHTML = upcomingTasks.length ? upcomingTasks.map(renderTaskItem).join("") : empty("다가오는 일이 없습니다.");
  els.doneTasks.innerHTML = doneTasks.length ? doneTasks.map(renderTaskItem).join("") : empty("완료한 일이 없습니다.");
}

function renderTaskItem(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  return `
    <article class="task-item${task.done ? " done" : ""}">
      <input type="checkbox" data-task-toggle="${h(task.id)}"${task.done ? " checked" : ""} aria-label="완료 처리">
      <main>
        <strong>${h(task.text)}</strong>
        <p>${h(project ? project.title : "공통 업무")} · ${h(formatDue(task.dueDate))}</p>
      </main>
      ${priorityPill(task.priority)}
      <button class="icon-button" data-delete-task="${h(task.id)}" type="button" title="삭제">×</button>
    </article>
  `;
}

function renderVault() {
  const query = normalizedSearch();
  const docs = vaultDocs.filter((doc) => !query || `${doc.title} ${doc.type} ${doc.summary}`.toLowerCase().includes(query));
  els.vaultCount.textContent = `${docs.length}개`;
  els.vaultList.innerHTML = docs.length
    ? docs.map((doc) => `
      <article class="doc-item">
        <span class="stage-pill">${h(doc.type)}</span>
        <main>
          <strong><a href="${h(doc.path)}" target="_blank" rel="noreferrer">${h(doc.title)}</a></strong>
          <p>${h(doc.summary)}</p>
        </main>
      </article>
    `).join("")
    : empty("검색 결과가 없습니다.");
}

function renderPrompts() {
  renderSelects();
  if (!els.promptOutput.value.trim()) generatePrompt();
}

function renderClients() {
  const query = normalizedSearch();
  const clients = state.clients.filter((client) => {
    const text = `${client.name} ${client.stage} ${client.memo}`.toLowerCase();
    return !query || text.includes(query);
  });

  els.clientGrid.innerHTML = clients.length
    ? clients.map(renderClientCard).join("")
    : empty("등록된 고객사가 없습니다.");
}

function renderClientCard(client) {
  return `
    <article class="client-card">
      <div class="panel-head">
        <h3>${h(client.name)}</h3>
        <button class="icon-button" data-delete-client="${h(client.id)}" type="button" title="삭제">×</button>
      </div>
      <div class="project-meta">
        <span class="stage-pill">${h(client.stage)}</span>
        <span class="pill">${h(formatDue(client.nextContact))}</span>
      </div>
      <p>${h(client.memo || "메모 없음")}</p>
      <div class="gift-list">
        ${giftItems.map((item) => `
          <label>
            <input type="checkbox" data-client-gift="${h(client.id)}" data-gift-item="${h(item)}"${(client.gifts || []).includes(item) ? " checked" : ""}>
            <span>${h(item)}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `;
}

function handleDocumentClick(event) {
  const viewJump = event.target.closest("[data-view-jump]");
  if (viewJump) {
    setView(viewJump.dataset.viewJump, {
      workFocus: viewJump.dataset.workFocus || "",
      taskFilter: viewJump.dataset.taskFilter || ""
    });
    return;
  }

  const stageFilter = event.target.closest("[data-stage-filter]");
  if (stageFilter) {
    state.ui.stageFilter = stageFilter.dataset.stageFilter;
    saveState();
    renderPipeline();
    return;
  }

  const selectProject = event.target.closest("[data-select-project]");
  if (selectProject) {
    state.ui.selectedProjectId = selectProject.dataset.selectProject;
    saveState();
    renderPipeline();
    return;
  }

  const card = event.target.closest("[data-project-card]");
  if (card && !event.target.closest("button, select, input, a")) {
    state.ui.selectedProjectId = card.dataset.projectCard;
    saveState();
    renderPipeline();
    return;
  }

  const editProject = event.target.closest("[data-edit-project]");
  if (editProject) {
    openProjectDialog(editProject.dataset.editProject);
    return;
  }

  const projectPrompt = event.target.closest("[data-project-prompt]");
  if (projectPrompt) {
    const project = state.projects.find((item) => item.id === projectPrompt.dataset.projectPrompt);
    if (project) {
      state.ui.activeView = "prompts";
      saveState();
      renderCurrentView();
      els.promptProject.value = project.id;
      els.promptTopic.value = project.title;
      generatePrompt();
    }
    return;
  }

  const deleteTask = event.target.closest("[data-delete-task]");
  if (deleteTask) {
    state.tasks = state.tasks.filter((task) => task.id !== deleteTask.dataset.deleteTask);
    saveState();
    renderCurrentView();
    showToast("할 일을 삭제했습니다.");
    return;
  }

  const deleteClient = event.target.closest("[data-delete-client]");
  if (deleteClient) {
    state.clients = state.clients.filter((client) => client.id !== deleteClient.dataset.deleteClient);
    saveState();
    renderClients();
    showToast("고객사를 삭제했습니다.");
    return;
  }

  const newsTask = event.target.closest("[data-news-task]");
  if (newsTask) {
    const item = (state.news || [])[Number(newsTask.dataset.newsTask)];
    if (item) {
      state.tasks.unshift({
        id: makeId("t"),
        text: `뉴스 확인: ${item.title}`,
        projectId: "",
        priority: "normal",
        dueDate: todayISO,
        done: false
      });
      saveState();
      renderWork();
      showToast("뉴스 소재를 할 일로 보냈습니다.");
    }
    return;
  }

  const deleteEvent = event.target.closest("[data-delete-event]");
  if (deleteEvent) {
    state.events = (state.events || []).filter((item) => item.id !== deleteEvent.dataset.deleteEvent);
    saveState();
    renderWork();
    showToast("일정을 삭제했습니다.");
    return;
  }

  const deleteFile = event.target.closest("[data-delete-file]");
  if (deleteFile) {
    state.files = (state.files || []).filter((item) => item.id !== deleteFile.dataset.deleteFile);
    saveState();
    renderWork();
    showToast("파일 메모를 삭제했습니다.");
    return;
  }

  const toggleAutomation = event.target.closest("[data-toggle-automation]");
  if (toggleAutomation) {
    const automation = (state.automations || []).find((item) => item.id === toggleAutomation.dataset.toggleAutomation);
    if (automation) {
      automation.active = !automation.active;
      saveState();
      renderWork();
      showToast(automation.active ? "자동화를 활성화했습니다." : "자동화를 중지했습니다.");
    }
  }
}

function handleDocumentKeydown(event) {
  if (!["Enter", " "].includes(event.key)) return;
  const viewJump = event.target.closest("[data-view-jump]");
  if (!viewJump) return;
  event.preventDefault();
  setView(viewJump.dataset.viewJump, {
    workFocus: viewJump.dataset.workFocus || "",
    taskFilter: viewJump.dataset.taskFilter || ""
  });
}

function handleDocumentChange(event) {
  const stageSelect = event.target.closest("[data-stage-select]");
  if (stageSelect) {
    const project = state.projects.find((item) => item.id === stageSelect.dataset.stageSelect);
    if (project) {
      project.stage = stageSelect.value;
      saveState();
      render();
      showToast("프로젝트 단계를 변경했습니다.");
    }
    return;
  }

  const check = event.target.closest("[data-project-check]");
  if (check) {
    const project = state.projects.find((item) => item.id === check.dataset.projectCheck);
    const item = check.dataset.checkItem;
    if (project) {
      project.checklist = project.checklist || [];
      if (check.checked && !project.checklist.includes(item)) project.checklist.push(item);
      if (!check.checked) project.checklist = project.checklist.filter((entry) => entry !== item);
      saveState();
      renderPipeline();
    }
    return;
  }

  const taskToggle = event.target.closest("[data-task-toggle]");
  if (taskToggle) {
    const task = state.tasks.find((item) => item.id === taskToggle.dataset.taskToggle);
    if (task) {
      task.done = taskToggle.checked;
      saveState();
      renderCurrentView();
    }
    return;
  }

  const clientGift = event.target.closest("[data-client-gift]");
  if (clientGift) {
    const client = state.clients.find((item) => item.id === clientGift.dataset.clientGift);
    const gift = clientGift.dataset.giftItem;
    if (client) {
      client.gifts = client.gifts || [];
      if (clientGift.checked && !client.gifts.includes(gift)) client.gifts.push(gift);
      if (!clientGift.checked) client.gifts = client.gifts.filter((item) => item !== gift);
      saveState();
    }
  }
}

function openProjectDialog(projectId = "") {
  const form = els.projectForm;
  form.reset();
  const project = state.projects.find((item) => item.id === projectId);
  els.dialogTitle.textContent = project ? "프로젝트 수정" : "새 프로젝트";
  els.deleteProjectBtn.hidden = !project;

  if (project) {
    form.elements.id.value = project.id;
    form.elements.title.value = project.title || "";
    form.elements.audience.value = project.audience || "";
    form.elements.stage.value = project.stage || "research";
    form.elements.priority.value = project.priority || "normal";
    form.elements.dueDate.value = project.dueDate || "";
    form.elements.owner.value = project.owner || "";
    form.elements.nextAction.value = project.nextAction || "";
    form.elements.thumbnail.value = project.thumbnail || "";
    form.elements.offer.value = project.offer || "";
    form.elements.notes.value = project.notes || "";
  } else {
    form.elements.stage.value = "research";
    form.elements.priority.value = "normal";
    form.elements.owner.value = "정엘";
    form.elements.dueDate.value = offsetDate(7);
    form.elements.id.value = "";
  }

  els.projectDialog.showModal();
}

function saveProjectFromDialog(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const existing = state.projects.find((item) => item.id === values.id);
  let savedProject;

  if (existing) {
    Object.assign(existing, {
      title: values.title.trim(),
      audience: values.audience.trim(),
      stage: values.stage,
      priority: values.priority,
      dueDate: values.dueDate,
      owner: values.owner.trim(),
      nextAction: values.nextAction.trim(),
      thumbnail: values.thumbnail.trim(),
      offer: values.offer.trim(),
      notes: values.notes.trim()
    });
    state.ui.selectedProjectId = existing.id;
    savedProject = existing;
  } else {
    const id = makeId("p");
    savedProject = {
      id,
      title: values.title.trim(),
      audience: values.audience.trim(),
      stage: values.stage,
      priority: values.priority,
      dueDate: values.dueDate,
      owner: values.owner.trim(),
      nextAction: values.nextAction.trim(),
      thumbnail: values.thumbnail.trim(),
      offer: values.offer.trim(),
      notes: values.notes.trim(),
      checklist: ["00_프로젝트_개요.md"]
    };
    state.projects.unshift(savedProject);
    state.ui.selectedProjectId = id;
  }

  els.projectDialog.close();
  saveState();
  render();
  showToast(currentUser ? "프로젝트를 클라우드에 저장했습니다." : "프로젝트를 브라우저에 저장했습니다.");
}

function deleteProjectFromDialog() {
  const id = els.projectForm.elements.id.value;
  if (!id) return;
  const project = state.projects.find((item) => item.id === id);
  const ok = window.confirm(`${project?.title || "이 프로젝트"}를 삭제할까요? 연결된 할 일은 공통 업무로 남습니다.`);
  if (!ok) return;

  state.projects = state.projects.filter((item) => item.id !== id);
  state.tasks.forEach((task) => {
    if (task.projectId === id) task.projectId = "";
  });
  state.ui.selectedProjectId = state.projects[0]?.id || "";
  els.projectDialog.close();
  saveState();
  render();
  showToast("프로젝트를 삭제했습니다.");
}

function addTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  state.tasks.unshift({
    id: makeId("t"),
    text: values.text.trim(),
    projectId: values.projectId,
    priority: values.priority,
    dueDate: values.dueDate || todayISO,
    done: false
  });
  form.reset();
  form.elements.priority.value = "normal";
  saveState();
  renderTasks();
  showToast("할 일을 추가했습니다.");
}

function addClient(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  state.clients.unshift({
    id: makeId("c"),
    name: values.name.trim(),
    stage: values.stage,
    nextContact: values.nextContact,
    memo: values.memo.trim(),
    gifts: []
  });
  form.reset();
  saveState();
  renderClients();
  showToast("고객사를 추가했습니다.");
}

function addWorkEvent(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  state.events = state.events || [];
  state.events.push({
    id: makeId("e"),
    title: values.title.trim(),
    date: values.date,
    time: values.time || ""
  });
  form.reset();
  saveState();
  renderWork();
  showToast("일정을 추가했습니다.");
}

function addWorkFile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  state.files = state.files || [];
  state.files.unshift({
    id: makeId("f"),
    name: values.name.trim(),
    folder: "업무",
    date: todayISO
  });
  form.reset();
  saveState();
  renderWork();
  showToast("파일 메모를 추가했습니다.");
}

function generatePrompt() {
  const type = els.promptType.value;
  const selectedProject = state.projects.find((project) => project.id === els.promptProject.value);
  const topic = (els.promptTopic.value || selectedProject?.title || "[주제명]").trim();
  const date = els.promptDate.value || todayISO;

  const common = [
    "너는 정엘가업승계연구소 J-BOS 콘텐츠 제작 AI다.",
    "",
    "반드시 아래 문서를 먼저 읽고 작업하라.",
    "",
    "1. [[정엘_브랜드_철학]]",
    "2. [[00_Master_Rulebook_최신본]]",
    "3. [[콘텐츠_제작_전체흐름]]",
    "4. [[썸네일_시스템]]",
    "5. [[20분_대본_시스템]]",
    "6. [[세법검증_전체흐름]]",
    "7. [[판례검증_전체흐름]]",
    "8. [[품질평가표_템플릿]]",
    "",
    `작업 주제는 "${topic}"이다.`,
    `기준일은 ${date}이다.`,
    "",
    "목표는 단순 조회수가 아니라 기업 오너의 상담 유입과 정엘가업승계연구소의 전문성 강화다.",
    ""
  ];

  const prompts = {
    content: [
      ...common,
      "아래 순서로 작업하라.",
      "",
      "1. 인기 콘텐츠를 리서치하여 큰 주제를 확정한다.",
      "2. 해당 주제의 인기 영상을 벤치마킹한다.",
      "3. 정엘 채널 인기영상 구조와 외부 인기영상 구조를 비교한다.",
      "4. 제목 후보 10개와 썸네일 카피 후보 10개를 만든다.",
      "5. 썸네일은 반드시 '대상 + 숫자 + 기업 오너가 얻는 이익 + 방법' 구조를 따른다.",
      "6. 제작일 기준 법령을 검토한다.",
      "7. 관련 판례 또는 조세심판원 결정례를 최소 3개 조사한다.",
      "8. 고객상담 유입 최적화 구조로 20분 대본을 작성한다.",
      "9. 1차 대본을 현재 법령 기준으로 상세 검증한다.",
      "10. 오류·과장·오해 가능성을 별도로 표시한다.",
      "11. 정엘 승인용 검토표를 작성한다.",
      "12. 승인 후 슬라이드 구성안과 슬라이드 노트용 대본을 작성한다.",
      "13. 최종 썸네일 카피 적합성을 다시 검증한다.",
      "14. 유튜브 업로드 패키지를 작성한다.",
      "15. 송출 후 피드백 분석 템플릿을 만든다.",
      "16. 마지막으로 이번 작업을 통해 J-BOS에 추가해야 할 규칙을 정리한다."
    ],
    law: [
      ...common,
      "검증 대상 주장을 쟁점별로 분리하고, 제작일 기준 법률·시행령·시행규칙·예규·질의회신·최근 개정세법·시행 예정 법령·일몰 예정 제도를 확인하라.",
      "API 결과만 믿지 말고 원문 링크와 시행일을 최종 확인하라.",
      "대본에서 수정해야 할 문장과 세무대리인 최종 검토가 필요한 부분을 표시하라."
    ],
    case: [
      ...common,
      "관련 대법원 판례, 하급심 판례, 조세심판원 결정례를 조사하라.",
      "각 근거는 사건 정보, 사실관계, 쟁점, 판단, 콘텐츠 활용 문장, 적용 한계, 원문 링크로 정리하라.",
      "사실관계가 다른 근거를 일반화하지 말고 대본에서 쓸 수 있는 표현 수준을 별도로 표시하라."
    ],
    quality: [
      ...common,
      "아래 산출물을 품질평가표 기준으로 검토하라.",
      "",
      "[검토 대상 산출물 붙여넣기]",
      "",
      "브랜드 철학 적합성, 기업 오너 타깃 적합성, 법령 정확성, 판례 근거, 과장 표현, 썸네일·제목 적합성, 상담 전환 구조를 점검하라."
    ],
    upgrade: [
      ...common,
      "이번 작업을 통해 J-BOS에 추가해야 할 규칙을 정리하라.",
      "기존 Rulebook과 충돌한 부분, 새로 추가해야 할 규칙, 폐기해야 할 규칙, 썸네일·제목·대본·법령·판례·상담 전환 관련 학습을 구분하라.",
      "마지막에는 다음 버전에 반영할 조항을 작성하라."
    ]
  };

  const guardrails = [
    "",
    "주의사항:",
    "",
    "- 브랜드 철학은 변경하지 않는다.",
    "- 법령 검증 전 절세 효과를 단정하지 않는다.",
    "- '연봉을 줄였더니 세금이 줄었다' 같은 당연한 인과관계 카피는 금지한다.",
    "- 기업 오너가 1초 안에 얻는 이익을 이해하지 못하는 썸네일은 실패다.",
    "- '소득디자인' 같은 내부 브랜딩 용어는 썸네일보다 영상 내부에서 정의한다.",
    "- 상담 유입을 목표로 하되 외부 표현에서는 '100% 상담 유입' 같은 보장 표현을 쓰지 않는다.",
    "- 모든 주장에는 법령, 판례, 예규, 질의회신 중 하나 이상의 근거를 제시한다."
  ];

  els.promptOutput.value = [...(prompts[type] || prompts.content), ...guardrails].join("\n");
}

function copyReadOrder() {
  const text = vaultDocs
    .slice(0, 8)
    .map((doc, index) => `${index + 1}. [[${doc.title}]]`)
    .join("\n");
  copyText(text, "읽기 순서를 복사했습니다.");
}

function exportState() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jbos-os-${todayISO}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("데이터 파일을 만들었습니다.");
}

function importState(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (!Array.isArray(imported.projects) || !Array.isArray(imported.tasks)) {
        throw new Error("Invalid J-BOS data");
      }
      state = {
        ...structuredCloneSafe(defaultState),
        ...imported,
        ui: { ...defaultState.ui, ...(imported.ui || {}) }
      };
      saveState();
      render();
      showToast("데이터를 불러왔습니다.");
    } catch (error) {
      console.warn(error);
      showToast("불러올 수 없는 파일입니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast(successMessage);
  }
}

function ensureSelectedProject() {
  if (!state.projects.some((project) => project.id === state.ui.selectedProjectId)) {
    state.ui.selectedProjectId = state.projects[0]?.id || "";
  }
}

function getSelectedProject() {
  return state.projects.find((project) => project.id === state.ui.selectedProjectId);
}

function projectProgress(project) {
  const checked = new Set(project.checklist || []);
  const stageBase = Math.max(0, stageIndex(project.stage)) / Math.max(1, stages.length - 1);
  const checklistRatio = checked.size / projectChecklist.length;
  return Math.round((stageBase * 0.55 + checklistRatio * 0.45) * 100);
}

function stageIndex(stageId) {
  return Math.max(0, stages.findIndex((stage) => stage.id === stageId));
}

function stagePill(stageId) {
  const stage = stages.find((item) => item.id === stageId);
  return `<span class="stage-pill">${h(stage?.label || "미정")}</span>`;
}

function priorityPill(priority) {
  const labels = {
    high: "긴급",
    normal: "보통",
    low: "낮음"
  };
  return `<span class="priority-pill priority-${h(priority || "normal")}">${h(labels[priority] || "보통")}</span>`;
}

function priorityWeight(priority) {
  return { high: 0, normal: 1, low: 2 }[priority] ?? 1;
}

function sortTask(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const priority = priorityWeight(a.priority) - priorityWeight(b.priority);
  if (priority !== 0) return priority;
  return new Date(a.dueDate || "2999-12-31") - new Date(b.dueDate || "2999-12-31");
}

function renderFocusItem(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  return `
    <article class="focus-item">
      ${priorityPill(task.priority)}
      <main>
        <strong>${h(task.text)}</strong>
        <p>${h(project?.title || "공통 업무")} · ${h(formatDue(task.dueDate))}</p>
      </main>
      <button class="icon-button" data-task-toggle-button="${h(task.id)}" type="button" title="완료">✓</button>
    </article>
  `;
}

function renderProjectMini(project) {
  return `
    <article class="project-mini">
      <main>
        <strong>${h(project.title)}</strong>
        <p>${h(project.nextAction || "다음 액션 미정")}</p>
      </main>
      ${stagePill(project.stage)}
    </article>
  `;
}

function renderDocShortcut(doc) {
  return `
    <article class="doc-item">
      <span class="stage-pill">${h(doc.type)}</span>
      <main>
        <strong><a href="${h(doc.path)}" target="_blank" rel="noreferrer">${h(doc.title)}</a></strong>
        <p>${h(doc.summary)}</p>
      </main>
    </article>
  `;
}

function metric(label, value, detail, targetView = "", options = {}) {
  const focusAttrs = [
    options.workFocus ? `data-work-focus="${h(options.workFocus)}"` : "",
    options.taskFilter ? `data-task-filter="${h(options.taskFilter)}"` : ""
  ].filter(Boolean).join(" ");
  const jumpAttrs = targetView
    ? ` data-view-jump="${h(targetView)}" ${focusAttrs} role="button" tabindex="0" aria-label="${h(`${label} 화면으로 이동`)}"`
    : "";
  const className = targetView ? "metric-card is-clickable" : "metric-card";
  return `
    <article class="${className}"${jumpAttrs}>
      <span>${h(label)}</span>
      <strong>${h(String(value))}</strong>
      <p>${h(detail)}</p>
    </article>
  `;
}

function empty(message) {
  return `<div class="empty-state">${h(message)}</div>`;
}

function projectText(project) {
  return `${project.title} ${project.audience} ${project.nextAction} ${project.thumbnail} ${project.offer} ${project.notes}`.toLowerCase();
}

function taskText(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  return `${task.text} ${project?.title || ""}`.toLowerCase();
}

function normalizedSearch() {
  return (state.ui.search || "").trim().toLowerCase();
}

function formatDue(value) {
  if (!value) return "날짜 미정";
  const date = parseDate(value);
  const diff = Math.ceil((stripTime(date) - stripTime(today)) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff <= 7) return `${diff}일 후`;
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(date);
}

function isTodayOrOverdue(value) {
  if (!value) return true;
  return stripTime(parseDate(value)) <= stripTime(today);
}

function isWithinDays(value, days) {
  if (!value) return false;
  const diff = Math.ceil((stripTime(parseDate(value)) - stripTime(today)) / 86400000);
  return diff >= 0 && diff <= days;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(days) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

document.addEventListener("click", (event) => {
  const completeButton = event.target.closest("[data-task-toggle-button]");
  if (!completeButton) return;
  const task = state.tasks.find((item) => item.id === completeButton.dataset.taskToggleButton);
  if (!task) return;
  task.done = true;
  saveState();
  renderCurrentView();
  showToast("완료 처리했습니다.");
});
