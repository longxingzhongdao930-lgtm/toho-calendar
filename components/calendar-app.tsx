"use client";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  House,
  List,
  Music2,
  GraduationCap,
  UserRound,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Search,
  MapPin,
  Clock3,
  X,
  Check,
  Download,
  Upload,
  Sun,
  Moon,
  Star,
  ArrowRight,
  Menu,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import {
  addDays,
  blankEvent,
  categories,
  dateKey,
  eventsOn,
  occurrences,
  parseDate,
  personalKinds,
  mergeEvents,
  SOURCE,
  STORAGE_KEY,
  validateEvents,
  type CalendarEvent,
  type Category,
} from "@/lib/calendar";
import { readStoredEvents, seedEvents } from "@/lib/seed";
import { ACADEMIC_REVISION, verificationLabel } from "@/lib/academic";
import TeachingPanel, { TeachingDaySummary } from "./teaching-panel";
import AppReadiness from "./app-readiness";
import { decodePrivateTransfer, TRANSFER_PREFIX } from "@/lib/private-transfer";
const nav = [
  { id: "home", label: "ホーム", icon: House },
  { id: "calendar", label: "カレンダー", icon: CalendarDays },
  { id: "list", label: "予定一覧", icon: List },
  { id: "orchestra", label: "オーケストラ", icon: Music2 },
  { id: "class", label: "授業・試験", icon: GraduationCap },
  { id: "personal", label: "個人予定", icon: UserRound },
  { id: "settings", label: "設定", icon: Settings },
];
const jpDate = (
  d: string,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    weekday: "short",
  },
) => parseDate(d).toLocaleDateString("ja-JP", options);
function timeLabel(e: CalendarEvent) {
  return e.allDay ? "終日" : `${e.time}${e.endTime ? ` – ${e.endTime}` : "〜"}`;
}
export default function CalendarApp() {
  const [today, setToday] = useState("2026-10-31"),
    [selected, setSelected] = useState("2026-10-31"),
    [view, setView] = useState("home"),
    [mode, setMode] = useState("month"),
    [events, setEvents] = useState<CalendarEvent[]>([]),
    [ready, setReady] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [dark, setDark] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [kind, setKind] = useState("all"),
    [sourceFilter, setSourceFilter] = useState("all"),
    [message, setMessage] = useState(""),
    [editor, setEditor] = useState<CalendarEvent | null>(null),
    [detail, setDetail] = useState<CalendarEvent | null>(null),
    [pendingDelete, setPendingDelete] = useState(false),
    [imported, setImported] = useState<CalendarEvent[] | null>(null),
    [linkImport, setLinkImport] = useState(false),
    [sidebar, setSidebar] = useState(false);
  const transferStarted = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const now = dateKey(new Date());
    setToday(now);
    setSelected(now);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setEvents(saved ? readStoredEvents(saved) : seedEvents());
      setDark(localStorage.getItem("toho-theme") === "dark");
    } catch {
      setStorageBlocked(true);
      setMessage(
        "保存データを読み込めません。元データ保護のため保存を停止しています。設定からバックアップを読み込んで復旧できます。",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const receive = () => {
      if (
        transferStarted.current ||
        !window.location.hash.startsWith(TRANSFER_PREFIX)
      )
        return;
      transferStarted.current = true;
      const encoded = window.location.hash.slice(TRANSFER_PREFIX.length);
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
      setView("settings");
      setLinkImport(true);
      setMessage("リンクの予定を端末内で読み込んでいます…");
      decodePrivateTransfer(encoded)
        .then((data) => {
          setImported(data);
          setMessage(
            "リンクの予定を読み込みました。確認して追加してください。",
          );
        })
        .catch((error) => {
          setLinkImport(false);
          setMessage(
            error instanceof Error
              ? error.message
              : "取込リンクを読み込めませんでした。",
          );
        })
        .finally(() => {
          transferStarted.current = false;
        });
    };
    window.addEventListener("hashchange", receive);
    receive();
    return () => window.removeEventListener("hashchange", receive);
  }, [ready]);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          academicRevision: ACADEMIC_REVISION,
          events,
        }),
      );
    } catch {
      setStorageBlocked(true);
      setMessage(
        "端末に保存できません。設定からJSONをダウンロードして保護してください。",
      );
    }
  }, [events, ready, storageBlocked]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    if (ready)
      try {
        localStorage.setItem("toho-theme", dark ? "dark" : "light");
      } catch {
        /* schedule warning handled separately */
      }
  }, [dark, ready]);
  const modal = !!(editor || detail || imported);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal) {
      restoreFocus.current = document.activeElement as HTMLElement;
      dialog?.showModal();
    } else {
      dialog?.close();
      restoreFocus.current?.focus();
    }
  }, [modal]);
  const close = () => {
    setEditor(null);
    setDetail(null);
    setImported(null);
    setLinkImport(false);
    setPendingDelete(false);
  };
  const navigate = (id: string) => {
    setView(id);
    setSidebar(false);
    setQuery("");
    setFilter("all");
    setKind("all");
    setSourceFilter("all");
  };
  const openNew = () => {
    setDetail(null);
    setEditor({
      ...blankEvent(selected),
      category: (["orchestra", "class", "personal"].includes(view)
        ? view
        : "personal") as Category,
      kind: view === "orchestra" ? "通常練習" : "練習",
    });
  };
  const todayItems = eventsOn(events, today);
  const next = occurrences(events, today, addDays(today, 365)).filter(
    ({ event, day }) =>
      day > today ||
      event.allDay ||
      (!event.endTime ? event.time : event.endTime) >=
        new Date().toTimeString().slice(0, 5),
  )[0];
  const monday = addDays(today, -((parseDate(today).getDay() + 6) % 7));
  const week = occurrences(events, monday, addDays(monday, 6));
  const title = nav.find((n) => n.id === view)?.label || "ホーム";
  const matches = (e: CalendarEvent) =>
    (sourceFilter === "all" ||
      (e.origin === "official" ? "official" : "personal") === sourceFilter) &&
    (filter === "all" || e.category === filter) &&
    (kind === "all" || e.kind === kind) &&
    `${e.title} ${e.location} ${e.notes}`
      .toLowerCase()
      .includes(query.toLowerCase());
  const shown = events
    .filter(
      (e) =>
        (view === "personal"
          ? e.origin !== "official"
          : !["orchestra", "class"].includes(view) || e.category === view) &&
        matches(e),
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
  function row(e: CalendarEvent, day?: string) {
    return (
      <button
        key={`${e.id}-${day || ""}`}
        className="event-row"
        onClick={() => setDetail(e)}
      >
        <span className={`event-icon ${e.category}`}>
          {e.category === "orchestra" ? (
            <Music2 size={20} />
          ) : e.category === "personal" ? (
            <UserRound size={20} />
          ) : e.category === "class" ? (
            <GraduationCap size={20} />
          ) : (
            <CalendarDays size={20} />
          )}
        </span>
        <span className="event-copy">
          <strong>
            {e.title}{" "}
            {e.important && <Star size={13} className="inline-star" />}
          </strong>
          <span>
            {day ? `${jpDate(day)} · ` : ""}
            {timeLabel(e)}
            {e.location ? ` · ${e.location}` : ""}
            <span className={`source-label ${e.verification}`}>
              {e.origin === "official" ? "大学公式 · " : "個人 · "}
              {verificationLabel(e)}
            </span>
          </span>
        </span>
        <span className={`tag ${e.category}`}>
          {categories[e.category].short}
        </span>
        <ChevronRight size={16} className="muted" />
      </button>
    );
  }
  function empty(text = "予定はありません") {
    return (
      <div className="empty">
        <CalendarDays size={30} />
        <strong>{text}</strong>
        <p>新しい予定を追加して、日々のリズムを整えましょう。</p>
        <button className="text-button" onClick={openNew}>
          予定を追加 <Plus size={15} />
        </button>
      </div>
    );
  }
  function shift(direction: number) {
    const d = parseDate(selected);
    if (view === "home" || mode === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() + direction);
    } else d.setDate(d.getDate() + direction * (mode === "week" ? 7 : 1));
    setSelected(dateKey(d));
  }
  function calendar() {
    const activeMode = view === "home" ? "month" : mode;
    const d = parseDate(selected);
    const monthStart = dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
    const start =
      activeMode === "month"
        ? addDays(monthStart, -parseDate(monthStart).getDay())
        : activeMode === "week"
          ? addDays(selected, -d.getDay())
          : selected;
    const count = activeMode === "month" ? 42 : activeMode === "week" ? 7 : 1;
    return (
      <>
        <div className="calendar-toolbar">
          <div className="month-control">
            <h2>
              {d.getFullYear()}年 <b>{d.getMonth() + 1}月</b>
              {activeMode === "day" ? ` ${d.getDate()}日` : ""}
            </h2>
            <button
              className="icon-button"
              aria-label="前へ"
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="次へ"
              onClick={() => shift(1)}
            >
              <ChevronRight size={18} />
            </button>
            <button className="small-button" onClick={() => setSelected(today)}>
              今日
            </button>
          </div>
          <div className="segmented" hidden={view === "home"}>
            {[
              ["month", "月"],
              ["week", "週"],
              ["day", "日"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={activeMode === id}
                className={activeMode === id ? "active" : ""}
                onClick={() => setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="month-picker">
          年月を選択
          <input
            type="month"
            aria-label="表示する年月"
            value={selected.slice(0, 7)}
            onChange={(e) => {
              if (/^\d{4}-\d{2}$/.test(e.target.value))
                setSelected(`${e.target.value}-01`);
            }}
          />
        </label>
        <div className="calendar-legend">
          {Object.entries(categories).map(([id, c]) => (
            <span key={id}>
              <i style={{ background: c.color }} />
              {c.label}
            </span>
          ))}
        </div>
        {activeMode === "day" ? (
          <div className="day-agenda">
            <h3>{jpDate(selected)}</h3>
            <TeachingDaySummary date={selected} />
            {eventsOn(events, selected)
              .filter(matches)
              .map((e) => row(e))}
            {!eventsOn(events, selected).filter(matches).length && empty()}
          </div>
        ) : (
          <div className={`calendar-grid ${activeMode}`}>
            <div className="weekdays">
              {["日", "月", "火", "水", "木", "金", "土"].map((s, i) => (
                <span
                  key={s}
                  className={i === 0 ? "sunday" : i === 6 ? "saturday" : ""}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="date-grid">
              {Array.from({ length: count }, (_, i) => {
                const day = addDays(start, i),
                  items = eventsOn(events, day).filter(matches);
                return (
                  <div
                    key={day}
                    className={`date-cell ${day.slice(0, 7) !== selected.slice(0, 7) ? "outside" : ""} ${day === selected ? "selected" : ""}`}
                  >
                    <button
                      className={`day-number ${day === today ? "is-today" : ""}`}
                      aria-label={`${jpDate(day)}の予定`}
                      aria-pressed={day === selected}
                      onClick={() => setSelected(day)}
                    >
                      {parseDate(day).getDate()}
                    </button>
                    <div className="cell-events">
                      {items.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setDetail(e)}
                          className={`calendar-event ${e.category}`}
                        >
                          <i />
                          {!e.allDay && <span>{e.time} </span>}
                          {e.important ? "★ " : ""}
                          {e.title}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <button
                          className="more-events"
                          onClick={() => {
                            setSelected(day);
                            setMode("day");
                          }}
                        >
                          +{items.length - 3}件
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeMode !== "day" && (
          <div className="selected-agenda">
            <TeachingDaySummary date={selected} />
            <div className="section-heading">
              <h3>{jpDate(selected)}の予定</h3>
              <button className="text-button" onClick={openNew}>
                <Plus size={15} />
                追加
              </button>
            </div>
            {eventsOn(events, selected)
              .filter(matches)
              .map((e) => row(e))}
            {!eventsOn(events, selected).filter(matches).length && (
              <p className="muted">
                この日の予定はありません。ゆっくり深呼吸を。
              </p>
            )}
          </div>
        )}
      </>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        メインコンテンツへ
      </a>
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="brand-mark">
            <Music2 size={24} />
          </span>
          <span>
            TOHO<span className="brand-sub">CALENDAR</span>
          </span>
        </a>
        <p className="school-name">東邦音楽大学 · STUDENT PLANNER</p>
        <div className="workspace-label">MY WORKSPACE</div>
        <nav aria-label="メインナビゲーション">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              aria-current={view === n.id ? "page" : undefined}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "home" && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <ShieldCheck size={17} />
            <span>
              あなたの予定は、この端末に。
              <small>アカウント登録なしで使えます</small>
            </span>
          </div>
          <p>
            音楽と、毎日のリズム。
            <span>TOHO Calendar © 2026 · 非公式の学生向けカレンダー</span>
          </p>
        </div>
      </aside>
      {sidebar && (
        <button
          aria-label="メニューを閉じる"
          className="sidebar-overlay"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="メニューを開く"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <span>マイワークスペース</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="sync-status">
              <i />
              {storageBlocked ? "保存停止中" : "ローカル保存"}
            </span>
            <button
              className="icon-button"
              aria-label="テーマ切替"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="avatar">T</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "home"
                  ? "YOUR DAILY HARMONY"
                  : "TOHO STUDENT PLANNER"}
              </div>
              <h1>{view === "home" ? "音楽と、毎日のリズム。" : title}</h1>
              <p>
                {view === "home"
                  ? `${jpDate(today, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}。今日も、自分のペースで。`
                  : view === "orchestra"
                    ? "一音ずつ、ひとつの音楽へ。練習から本番までをひとつに。"
                    : view === "settings"
                      ? "あなたらしく、安心して使うために。"
                      : "大切な時間を、ひとつのカレンダーに。"}
              </p>
            </div>
            <button
              className="primary-button"
              onClick={openNew}
              disabled={!ready}
            >
              <Plus size={18} />
              予定を追加
            </button>
          </div>
          <AppReadiness />
          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button aria-label="通知を閉じる" onClick={() => setMessage("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {!ready ? (
            <p role="status">予定を読み込んでいます…</p>
          ) : view === "home" ? (
            <>
              <div className="home-top">
                <section className="hero-card">
                  <div className="hero-text">
                    <span className="hero-kicker">
                      <span /> UP NEXT{" "}
                      <span className="hero-date">次の予定</span>
                    </span>
                    <div className="hero-content">
                      <span className="hero-category">
                        {next
                          ? categories[next.event.category].label
                          : "YOUR NEXT CHAPTER"}
                      </span>
                      <h2>
                        {next ? next.event.title : "次の音楽を、ここから。"}
                      </h2>
                      <p>
                        <CalendarDays size={16} />
                        {next ? jpDate(next.day) : "新しい予定を追加しましょう"}
                        {next && (
                          <>
                            <span className="hero-divider" />{" "}
                            <Clock3 size={16} />
                            {timeLabel(next.event)}
                          </>
                        )}
                      </p>
                      {next && (
                        <span className="hero-confirm">
                          {verificationLabel(next.event)}
                        </span>
                      )}
                    </div>
                    <button
                      className="hero-link"
                      onClick={() => (next ? setDetail(next.event) : openNew())}
                    >
                      予定の詳細を見る <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="music-staff">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <span className="music-note note-one">♪</span>
                    <span className="music-note note-two">♫</span>
                    <span className="art-caption">LIFE IN HARMONY</span>
                  </div>
                </section>
                <section className="today-card card">
                  <div className="section-heading">
                    <h2>今日の予定</h2>
                    <span className="count">{todayItems.length}</span>
                  </div>
                  <div className="today-date">
                    <strong>{parseDate(today).getDate()}</strong>
                    <span>
                      {jpDate(today, { month: "long" })}
                      <small>{jpDate(today, { weekday: "long" })}</small>
                    </span>
                    <span className="today-label">TODAY</span>
                  </div>
                  {todayItems.length ? (
                    todayItems.slice(0, 2).map((e) => row(e))
                  ) : (
                    <div className="today-empty">
                      <span className="sun-illustration">
                        <Sun size={28} strokeWidth={1.3} />
                      </span>
                      <p>今日は、余白のある一日。</p>
                      <small>練習も、ひと休みも大切に。</small>
                    </div>
                  )}
                  <button
                    className="text-button today-link"
                    onClick={() => {
                      setSelected(today);
                      navigate("calendar");
                      setMode("day");
                    }}
                  >
                    今日を詳しく見る <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <section className="card launch-calendar">
                <div className="section-heading">
                  <h2>月間カレンダー</h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected(today);
                      setMode("month");
                      navigate("calendar");
                    }}
                  >
                    カレンダーを開く <ArrowRight size={15} />
                  </button>
                </div>
                {calendar()}
              </section>
              <div className="stats-row">
                {[
                  {
                    icon: CalendarDays,
                    label: "今週の予定",
                    value: new Set(week.map((x) => x.event.id)).size,
                    unit: "件",
                    color: "blue",
                  },
                  {
                    icon: Music2,
                    label: "次のオーケストラ",
                    value: occurrences(
                      events.filter((e) => e.category === "orchestra"),
                      today,
                      addDays(today, 180),
                    )[0]?.day,
                    unit: "",
                    color: "purple",
                  },
                  {
                    icon: GraduationCap,
                    label: "次の授業・試験",
                    value: occurrences(
                      events.filter((e) => e.category === "class"),
                      today,
                      addDays(today, 180),
                    )[0]?.day,
                    unit: "",
                    color: "amber",
                  },
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <span className={`stat-icon ${s.color}`}>
                      <s.icon size={20} />
                    </span>
                    <div>
                      <span>{s.label}</span>
                      <strong>
                        {typeof s.value === "string"
                          ? jpDate(s.value, {
                              month: "numeric",
                              day: "numeric",
                            })
                          : (s.value ?? "未登録")}{" "}
                        <small>{s.unit}</small>
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="home-bottom">
                <section className="card week-card">
                  <div className="section-heading">
                    <div>
                      <h2>今週の予定</h2>
                      <p>
                        {jpDate(monday)} – {jpDate(addDays(monday, 6))}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        navigate("calendar");
                        setMode("week");
                        setSelected(today);
                      }}
                    >
                      カレンダーへ <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="week-strip">
                    {Array.from({ length: 7 }, (_, i) => {
                      const day = addDays(monday, i);
                      return (
                        <button
                          key={day}
                          className={day === today ? "active" : ""}
                          onClick={() => {
                            setSelected(day);
                            navigate("calendar");
                            setMode("day");
                          }}
                        >
                          <span>{jpDate(day, { weekday: "short" })}</span>
                          <strong>{parseDate(day).getDate()}</strong>
                          <i
                            style={{
                              opacity: eventsOn(events, day).length ? 1 : 0,
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {week.length
                    ? week.slice(0, 4).map(({ event, day }) => row(event, day))
                    : empty("今週の予定はまだありません")}
                  <div className="card-footnote">
                    小さな積み重ねが、次のステージにつながる。
                  </div>
                </section>
                <section className="card announcements">
                  <div className="section-heading">
                    <h2>
                      <Bell size={17} /> 大切なお知らせ
                    </h2>
                    <span className="notification-dot" />
                  </div>
                  <a
                    className="announcement featured"
                    href={SOURCE}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="announcement-label">2026年度 学年暦</span>
                    <h3>
                      学年暦を確認して、
                      <br />
                      少し先の予定まで。
                    </h3>
                    <p>
                      授業・試験・演奏会の日程は
                      <br />
                      必ず大学の公式情報をご確認ください。
                    </p>
                    <span className="text-button">
                      公式PDFを見る <ArrowUpRight size={15} />
                    </span>
                  </a>
                  <div className="announcement">
                    <span className="warning-label">要確認</span>
                    <h3>初期登録の大学行事について</h3>
                    <p>
                      2026年度の公式学年暦画像から抽出しました。判読できない細字は「要確認」です。最新の大学の案内も確認してください。
                    </p>
                  </div>
                  <div className="privacy-note">
                    <ShieldCheck size={17} />
                    予定データはブラウザ内に保存されます
                  </div>
                </section>
              </div>
            </>
          ) : view === "calendar" ? (
            <section className="card full-calendar">{calendar()}</section>
          ) : view === "settings" ? (
            <div className="settings-grid">
              <section className="card settings-card">
                <h2>表示テーマ</h2>
                <p>気分や環境に合わせて選べます。</p>
                <div className="theme-options">
                  <button
                    className={!dark ? "chosen" : ""}
                    onClick={() => setDark(false)}
                  >
                    <Sun />
                    ライト{!dark && <Check size={16} />}
                  </button>
                  <button
                    className={dark ? "chosen" : ""}
                    onClick={() => setDark(true)}
                  >
                    <Moon />
                    ダーク{dark && <Check size={16} />}
                  </button>
                </div>
              </section>
              <section className="card settings-card">
                <h2>データとバックアップ</h2>
                <p>
                  このブラウザに {events.length}{" "}
                  件の予定を保存。端末の変更やブラウザデータの削除に備えて、定期的にバックアップしてください。
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob(
                        [
                          JSON.stringify(
                            {
                              version: 1,
                              academicRevision: ACADEMIC_REVISION,
                              exportedAt: new Date().toISOString(),
                              events,
                            },
                            null,
                            2,
                          ),
                        ],
                        { type: "application/json" },
                      ),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `toho-calendar-${today}.json`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  <Download size={17} />
                  JSONを書き出す
                </button>
                <button
                  className="secondary-button"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={17} />
                  JSONを読み込む
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      if (f.size > 5_000_000)
                        throw new Error("ファイルは5MB以内にしてください。");
                      setLinkImport(false);
                      setImported(readStoredEvents(await f.text()));
                    } catch (err) {
                      setMessage(
                        err instanceof Error
                          ? err.message
                          : "読み込みに失敗しました。",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </section>
              <section className="card settings-card">
                <h2>TOHO Calendar について</h2>
                <p>
                  東邦音楽大学の学生向け非公式アプリです。大学が提供・運営するサービスではありません。外部への予定送信、アカウント登録、APIキーは不要です。
                </p>
                <p>
                  繰り返し予定の編集・削除はシリーズ全体に適用されます。月末の繰り返しは同じ日が存在する月のみ表示します。初期データは2026年4月〜2027年3月の大学予定です。画像の未読箇所は要確認です。
                </p>
                <a
                  className="text-button"
                  href={SOURCE}
                  target="_blank"
                  rel="noreferrer"
                >
                  参照：2026年度公式学年暦 <ArrowUpRight size={14} />
                </a>
              </section>
            </div>
          ) : (
            <section className="card list-card">
              {view === "personal" && (
                <section
                  className="personal-shortcuts"
                  aria-label="レッスン・合わせを追加"
                >
                  <h2>レッスン・合わせを追加</h2>
                  <p>
                    種類を選び、日時を指定して保存してください。予定はこの端末だけに保存されます。
                  </p>
                  <div>
                    {personalKinds.map((kind) => (
                      <button
                        key={kind}
                        className="secondary-button"
                        onClick={() =>
                          setEditor({
                            ...blankEvent(selected),
                            title: kind,
                            kind,
                            time: "",
                            endTime: "",
                          })
                        }
                      >
                        <Plus size={15} />
                        {kind}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {view === "class" && <TeachingPanel />}
              <div className="list-tools">
                <select
                  aria-label="予定の出典"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">公式・個人すべて</option>
                  <option value="official">大学公式予定</option>
                  <option value="personal">個人予定</option>
                </select>
                <label className="search-box">
                  <Search size={18} />
                  <input
                    aria-label="予定を検索"
                    placeholder="予定名・会場・メモを検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter-select">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="カテゴリ絞り込み"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">すべてのカテゴリ</option>
                    {Object.entries(categories).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                {(view === "orchestra" || view === "personal") && (
                  <select
                    aria-label="予定の種類"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="all">すべての種類</option>
                    {(view === "personal"
                      ? personalKinds
                      : [
                          "通常練習",
                          "臨時練習",
                          "分奏",
                          "本番",
                          "GP",
                          "休講",
                          "搬出",
                        ]
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="section-heading">
                <h2>
                  {title}
                  <span className="result-count">{shown.length} 件</span>
                </h2>
                <span className="muted list-hint">
                  日付順 · 繰り返しは開始日で表示
                </span>
              </div>
              {shown.length
                ? Array.from(new Set(shown.map((e) => e.date))).map((date) => (
                    <section className="date-group" key={date}>
                      <h3>
                        {jpDate(date, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        <span>
                          {shown.filter((e) => e.date === date).length}件
                        </span>
                      </h3>
                      {shown
                        .filter((e) => e.date === date)
                        .map((e) => (
                          <div className="dated-row" key={e.id}>
                            {row(e)}
                          </div>
                        ))}
                    </section>
                  ))
                : empty(
                    query
                      ? "検索に一致する予定はありません"
                      : "予定はまだありません",
                  )}
            </section>
          )}
          <footer className="main-footer">
            <span>MAKE TIME FOR YOUR MUSIC.</span>
            <span>
              TOHO Calendar <span className="footer-dot">·</span>{" "}
              あなたの毎日に、心地よいリズムを。
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="モバイルナビゲーション">
        {nav
          .filter((n) =>
            ["home", "calendar", "list", "personal", "settings"].includes(n.id),
          )
          .map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
              aria-current={view === n.id ? "page" : undefined}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
            </button>
          ))}
      </nav>
      <dialog
        ref={dialogRef}
        className="modal"
        aria-label={
          editor ? "予定を編集" : detail ? "予定の詳細" : "予定を読み込む"
        }
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="modal-inner">
          <button
            className="modal-close icon-button"
            aria-label="閉じる"
            onClick={close}
          >
            <X size={21} />
          </button>
          {editor ? (
            <>
              <div className="eyebrow">PLAN YOUR MOMENT</div>
              <h2>{editor.id ? "予定を編集" : "新しい予定"}</h2>
              <EventForm
                value={editor}
                onCancel={close}
                onSave={(value) => {
                  try {
                    const next = {
                      ...value,
                      ...(value.origin === "official"
                        ? {
                            id: crypto.randomUUID(),
                            origin: "personal" as const,
                            verification: "personal" as const,
                            sourcePage: undefined,
                            notes: `大学公式予定から作成した個人用コピー（編集後の内容は未照合）。\n${value.notes}`,
                          }
                        : {}),
                      id:
                        value.origin === "official"
                          ? crypto.randomUUID()
                          : value.id || crypto.randomUUID(),
                    };
                    validateEvents([next]);
                    setEvents((prev) => [
                      ...prev.filter((e) => e.id !== next.id),
                      next,
                    ]);
                    close();
                    setMessage("予定を保存しました。");
                  } catch (err) {
                    setMessage(
                      err instanceof Error
                        ? err.message
                        : "保存できませんでした。",
                    );
                  }
                }}
              />
            </>
          ) : detail ? (
            <>
              <span className={`tag ${detail.category}`}>
                {categories[detail.category].label}
              </span>
              <h2 className="detail-title">{detail.title}</h2>
              {detail.important && (
                <span className="important-label">
                  <Star size={14} />
                  重要な予定
                </span>
              )}
              <div className="detail-lines">
                <p>
                  <CalendarDays size={18} />
                  {jpDate(detail.date, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                  {detail.endDate !== detail.date &&
                    ` 〜 ${jpDate(detail.endDate)}`}
                </p>
                <p>
                  <Clock3 size={18} />
                  {timeLabel(detail)}
                </p>
                <p>
                  <MapPin size={18} />
                  {detail.location || "会場は未設定"}
                </p>
                <p>
                  <Music2 size={18} />
                  {detail.kind}{" "}
                  {detail.repeat !== "none" &&
                    `· ${detail.repeat === "weekly" ? "毎週" : "毎月"}${detail.repeatUntil ? `（${jpDate(detail.repeatUntil)}まで）` : ""}`}
                </p>
              </div>
              {detail.verification === "unverified" ? (
                <div className="verification">
                  要確認：画像の細字・時刻・実施日・適用範囲などに未確定の情報があります。
                  {detail.origin === "official" ? (
                    <a href={SOURCE} target="_blank" rel="noreferrer">
                      大学公式学年暦を確認 <ArrowUpRight size={13} />
                    </a>
                  ) : (
                    <p>
                      提供された個人の資料と、担当者からの最新の案内をご確認ください。
                    </p>
                  )}
                </div>
              ) : detail.verification === "official" ? (
                <div className="verification official-verified">
                  公式資料確認済み：提供された学年暦画像の
                  {detail.sourcePage === 1 ? "前期" : "後期"}ページと照合。
                  <a href={SOURCE} target="_blank" rel="noreferrer">
                    参照先の公式PDF <ArrowUpRight size={13} />
                  </a>
                </div>
              ) : (
                <div className="personal-status">
                  <Check size={15} />
                  ユーザー提供の予定
                </div>
              )}
              <p className="detail-notes">{detail.notes}</p>
              {pendingDelete ? (
                <div className="delete-confirm">
                  <p>
                    この予定を削除しますか？
                    {detail.repeat !== "none"
                      ? "繰り返しの全予定が削除されます。"
                      : ""}
                  </p>
                  <button
                    className="danger-button"
                    onClick={() => {
                      setEvents(events.filter((e) => e.id !== detail.id));
                      close();
                      setMessage("予定を削除しました。");
                    }}
                  >
                    削除する
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setPendingDelete(false)}
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="modal-actions">
                  <button
                    className="danger-text"
                    onClick={() => setPendingDelete(true)}
                  >
                    削除
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setEditor(detail);
                      setDetail(null);
                    }}
                  >
                    {detail.origin === "official"
                      ? "個人用コピーを編集"
                      : "予定を編集"}
                  </button>
                </div>
              )}
            </>
          ) : imported ? (
            <>
              <h2>予定を読み込む</h2>
              {linkImport && (
                <p className="private-import-note">
                  個人予定の取込リンクです。予定は外部へ送信せず、このブラウザ内だけに保存します。普段使うSafariまたはホーム画面のアプリで読み込んでください。
                </p>
              )}
              <p>
                {imported.length}
                件を読み込みました。「追加」は既存の予定を保持します。同じIDは取り込み内容で更新され、同一内容の予定は重複させません。
                {!linkImport && (
                  <>
                    「置き換え」は現在の全予定を消すため、先に書き出してください。
                  </>
                )}
              </p>
              <div className="modal-actions">
                <button className="secondary-button" onClick={close}>
                  キャンセル
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    try {
                      setEvents(mergeEvents(events, imported));
                      setStorageBlocked(false);
                      close();
                      setMessage(
                        "予定を追加しました。同じ予定は重複登録していません。",
                      );
                    } catch (err) {
                      setMessage(
                        err instanceof Error
                          ? err.message
                          : "追加できませんでした。",
                      );
                    }
                  }}
                >
                  既存の予定を残して追加
                </button>
                {!linkImport && (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEvents(imported);
                      setStorageBlocked(false);
                      close();
                      setMessage("バックアップを復元しました。");
                    }}
                  >
                    置き換えて復元
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
function EventForm({
  value,
  onSave,
  onCancel,
}: {
  value: CalendarEvent;
  onSave: (e: CalendarEvent) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value),
    [error, setError] = useState(""),
    [excludedInput, setExcludedInput] = useState(
      (value.excludedDates || []).join(", "),
    );
  const put = <K extends keyof CalendarEvent>(key: K, v: CalendarEvent[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));
  return (
    <form
      className="event-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const v = {
            ...draft,
            title: draft.title.trim(),
            endDate: draft.repeat === "none" ? draft.endDate : draft.date,
            excludedDates:
              draft.repeat === "none"
                ? undefined
                : excludedInput
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
          };
          validateEvents([{ ...v, id: v.id || "new" }]);
          onSave(v);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "入力を確認してください。",
          );
        }
      }}
    >
      <label>
        予定名
        <input
          autoFocus
          required
          maxLength={150}
          placeholder="例：伴奏合わせ"
          value={draft.title}
          onChange={(e) => put("title", e.target.value)}
        />
      </label>
      <div className="form-pair">
        <label>
          カテゴリ
          <select
            aria-label="カテゴリ"
            value={draft.category}
            onChange={(e) => put("category", e.target.value as Category)}
          >
            {Object.entries(categories).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          種類
          <input
            list="event-kinds"
            value={draft.kind}
            maxLength={100}
            onChange={(e) => put("kind", e.target.value)}
          />
          <datalist id="event-kinds">
            {(draft.category === "orchestra"
              ? ["通常練習", "臨時練習", "分奏", "本番", "GP", "休講", "搬出"]
              : draft.category === "class"
                ? ["平常授業", "休講", "補講", "試験期間"]
                : [...personalKinds, "レッスン", "練習"]
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
      </div>
      {draft.category === "personal" && (
        <fieldset className="personal-kind-options">
          <legend>レッスン・合わせの種類を選択</legend>
          <div>
            {personalKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={draft.kind === kind}
                onClick={() =>
                  setDraft((d) => ({ ...d, kind, title: d.title || kind }))
                }
              >
                {kind}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={draft.allDay}
          onChange={(e) => put("allDay", e.target.checked)}
        />
        終日予定
      </label>
      <div className="form-pair">
        <label>
          開始日
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                date: e.target.value,
                endDate:
                  d.endDate < e.target.value ? e.target.value : d.endDate,
              }))
            }
          />
        </label>
        {draft.repeat === "none" && (
          <label>
            終了日
            <input
              type="date"
              required
              min={draft.date}
              value={draft.endDate}
              onChange={(e) => put("endDate", e.target.value)}
            />
          </label>
        )}
      </div>
      {!draft.allDay && (
        <div className="form-pair">
          <label>
            開始時刻
            <input
              type="time"
              required
              value={draft.time}
              onChange={(e) => put("time", e.target.value)}
            />
          </label>
          <label>
            終了時刻（任意）
            <input
              type="time"
              value={draft.endTime}
              onChange={(e) => put("endTime", e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="form-pair">
        <label>
          繰り返し
          <select
            aria-label="繰り返し"
            value={draft.repeat}
            onChange={(e) =>
              put("repeat", e.target.value as CalendarEvent["repeat"])
            }
          >
            <option value="none">繰り返さない</option>
            <option value="weekly">毎週</option>
            <option value="monthly">毎月</option>
          </select>
        </label>
        {draft.repeat !== "none" && (
          <label>
            繰り返し終了日（任意）
            <input
              type="date"
              min={draft.date}
              value={draft.repeatUntil}
              onChange={(e) => put("repeatUntil", e.target.value)}
            />
          </label>
        )}
      </div>
      {draft.repeat !== "none" && (
        <label>
          実施しない日（カンマ区切り）
          <input
            placeholder="YYYY-MM-DD, YYYY-MM-DD"
            value={excludedInput}
            onChange={(e) => setExcludedInput(e.target.value)}
          />
        </label>
      )}
      {draft.repeat !== "none" && (
        <p className="form-help">
          編集はシリーズ全体に反映。繰り返しは1日単位です。
        </p>
      )}
      <label>
        会場
        <input
          maxLength={200}
          placeholder="例：練習室、ホール"
          value={draft.location}
          onChange={(e) => put("location", e.target.value)}
        />
      </label>
      <label>
        メモ
        <textarea
          rows={3}
          maxLength={10000}
          value={draft.notes}
          onChange={(e) => put("notes", e.target.value)}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={draft.important}
          onChange={(e) => put("important", e.target.checked)}
        />
        <Star size={15} />
        重要な予定として強調
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          キャンセル
        </button>
        <button className="primary-button" type="submit">
          <Check size={17} />
          保存する
        </button>
      </div>
    </form>
  );
}
