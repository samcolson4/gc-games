import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { colors, fonts } from "../styles/tokens";
import { getLeaderInfo, LeaderInfo } from "../utils/scoreHelpers";

const GAME_ROUTES: Record<string, { playerKey: string; scoreKey: string; label: string }> = {
  rummy: { playerKey: "rummyPlayers", scoreKey: "rummyScores", label: "Rummy" },
  golf: { playerKey: "golfPlayers", scoreKey: "golfScores", label: "Golf" },
  "mexican-train": {
    playerKey: "mexicanTrainPlayers",
    scoreKey: "mexicanTrainScores",
    label: "Mexican Train",
  },
};

function SearchGlyph() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.ink}
      strokeWidth="2"
      style={{ marginTop: 1, flexShrink: 0 }}
    >
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </svg>
  );
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function HeaderBar() {
  const location = useLocation();
  const activePage = location.pathname === "/" ? "rummy" : location.pathname.slice(1);
  const [leader, setLeader] = useState<LeaderInfo | null>(null);

  const refreshLeader = () => {
    const game = GAME_ROUTES[activePage];
    if (game) {
      setLeader(getLeaderInfo(game.playerKey, game.scoreKey));
    } else {
      setLeader(null);
    }
  };

  useEffect(() => {
    refreshLeader();
    const interval = setInterval(refreshLeader, 1000);
    window.addEventListener("storage", refreshLeader);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", refreshLeader);
    };
  }, [activePage]);

  const navItems = [
    { to: "/", key: "rummy", label: "Rummy" },
    { to: "/golf", key: "golf", label: "Golf" },
    { to: "/mexican-train", key: "mexican-train", label: "Mexican Train" },
    { to: "/suburb", key: "suburb", label: "Suburb" },
    { to: "/nz", key: "nz", label: "NZ" },
  ];

  const isScorePage = !!GAME_ROUTES[activePage];
  const isSuburb = activePage === "suburb";
  const isNz = activePage === "nz";

  let liveLabel = "STANDBY";
  let liveLabelColor: string = colors.meta3;
  let dotColor: string = colors.meta3;
  let liveHeadline = "No game in progress";
  let liveMeta = "";

  if (isScorePage && leader) {
    liveLabel = "LEADING";
    liveLabelColor = colors.accent;
    dotColor = colors.accent;
    liveHeadline = `${leader.name} leads with ${leader.total}`;
    liveMeta = `· ${leader.playerCount} players · ${leader.roundCount} rounds`;
  } else if (isSuburb) {
    liveLabel = "MAP";
    liveHeadline = "Suburbs reference map";
    liveMeta = "· drag to move · scroll to zoom";
  } else if (isNz) {
    liveLabel = "FEATURE";
    liveHeadline = "New Zealand";
    liveMeta = "· feature presentation";
  }

  const leaderChip =
    isScorePage && leader ? `${leader.name}  ${leader.total}` : "—";

  return (
    <div style={{ width: "100%", backgroundColor: colors.paper }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Utility bar */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "16px 0 8px",
            fontFamily: fonts.franklin,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <SearchGlyph />
            <div>
              <div style={{ fontSize: 13.5, color: colors.ink, fontWeight: 500 }}>
                {formatDate()}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: colors.meta,
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  marginTop: 2,
                }}
              >
                Today&apos;s Scorebook
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: colors.meta3,
                fontWeight: 600,
              }}
            >
              Currently Leading
            </div>
            <div
              style={{
                fontSize: 15,
                color: colors.ink,
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              {leaderChip}
            </div>
          </div>
        </div>

        {/* Masthead */}
        <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
          <h1
            style={{
              fontFamily: fonts.masthead,
              fontWeight: 700,
              fontSize: "clamp(38px, 6.6vw, 78px)",
              lineHeight: 1.04,
              margin: 0,
              color: colors.ink,
              letterSpacing: "0.01em",
            }}
          >
            Goodridge Colson Games
          </h1>
        </div>

        {/* Nav */}
        <div style={{ borderTop: `1px solid ${colors.ink}` }}>
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 30,
              padding: "11px 0",
            }}
          >
            {navItems.map(({ to, key, label }) => {
              const isActive = activePage === key;
              return (
                <Link
                  key={key}
                  to={to}
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 17,
                    fontWeight: isActive ? 700 : 500,
                    color: colors.ink,
                    textDecoration: "none",
                    borderBottom: isActive ? `2px solid ${colors.ink}` : "2px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Double rule */}
        <div
          style={{
            borderTop: `3px solid ${colors.ink}`,
            borderBottom: `1px solid ${colors.ink}`,
            height: 3,
          }}
        />

        {/* Live strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            padding: "13px 0",
            borderBottom: `1px solid ${colors.rule}`,
            flexWrap: "wrap",
            textAlign: "center",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span
              className="live-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: dotColor,
              }}
            />
            <span
              style={{
                fontFamily: fonts.franklin,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: liveLabelColor,
              }}
            >
              {liveLabel}
            </span>
          </span>
          <span
            style={{
              fontFamily: fonts.serif,
              fontSize: 18,
              color: colors.ink,
            }}
          >
            {liveHeadline}
          </span>
          {liveMeta && (
            <span
              style={{
                fontFamily: fonts.franklin,
                fontSize: 13,
                color: colors.meta3,
              }}
            >
              {liveMeta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeaderBar;
