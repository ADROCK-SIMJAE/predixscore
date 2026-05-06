"use client";

/* ══════════════════════════════════════════════════
   PREDIX SCORE — 다크 럭셔리 / 블랙 & 골드
   "예측력을 검증하고 권위를 부여하는 플랫폼"
   모바일 디바이스 최적화 버전
══════════════════════════════════════════════════ */

import { C } from "@/lib/tokens";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ChallengeScreen } from "@/components/screens/ChallengeScreen";
import { RankingScreen } from "@/components/screens/RankingScreen";
import { MyScreen } from "@/components/screens/MyScreen";
import { ExpertScreen } from "@/components/screens/ExpertScreen";
import { ChatroomScreen } from "@/components/screens/ChatroomScreen";
import { DMListScreen } from "@/components/screens/DMListScreen";
import { DMChatScreen } from "@/components/screens/DMChatScreen";
import { EventScreen } from "@/components/screens/EventScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { PredictModal } from "@/components/modals/PredictModal";
import { AuthModal } from "@/components/modals/AuthModal";
import { ChallengePopup } from "@/components/modals/ChallengePopup";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { signOut } from "@/lib/supabase/auth";

/* ══════════════════════════════════════════════════
   ROOT APP — 모바일 최적화
══════════════════════════════════════════════════ */
export default function App() {
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const stack = useUiStore((s) => s.stack);
  const showAuth = useUiStore((s) => s.showAuth);
  const showChallenge = useUiStore((s) => s.showChallenge);
  const slideIdx = useUiStore((s) => s.slideIdx);
  const push = useUiStore((s) => s.push);
  const pop = useUiStore((s) => s.pop);
  const nav = useUiStore((s) => s.nav);
  const setShowAuth = useUiStore((s) => s.setShowAuth);
  const setShowChallenge = useUiStore((s) => s.setShowChallenge);
  const setSlideIdx = useUiStore((s) => s.setSlideIdx);

  const cur = stack[stack.length - 1];
  const onAuth = () => setShowAuth(true);
  const onAuthSuccess = () => setShowAuth(false);
  const onLogout = async () => {
    try { await signOut(); } catch { /* noop */ }
  };

  const render = () => {
    const { screen, expert, conv, pred } = cur;
    switch (screen) {
      case "home":      return <HomeScreen      onNav={nav} push={push} loggedIn={loggedIn} onAuth={onAuth} />;
      case "feed":      return <FeedScreen      onNav={nav} push={push} />;
      case "challenge": return <ChallengeScreen onNav={nav} push={push} loggedIn={loggedIn} onAuth={onAuth} />;
      case "ranking":   return <RankingScreen   onNav={nav} push={push} />;
      case "my":        return <MyScreen        onNav={nav} push={push} loggedIn={loggedIn} onAuth={onAuth} onLogout={onLogout} />;
      case "expert":    return <ExpertScreen    expert={expert} onBack={pop} push={push} />;
      case "chatroom":  return <ChatroomScreen  expert={expert} onBack={pop} />;
      case "dm_list":   return <DMListScreen    onBack={pop} push={push} />;
      case "dm_chat":   return <DMChatScreen    conv={conv} onBack={pop} />;
      case "event":     return <EventScreen     onBack={pop} push={push} />;
      case "result":    return <ResultScreen    pred={pred} onBack={pop} push={push} />;
      case "pred_detail":
        return pred ? (
          <PredictModal pred={pred} onClose={pop} loggedIn={loggedIn} onAuth={onAuth} />
        ) : null;
      case "feed_detail":
        return <ResultScreen pred={pred} onBack={pop} push={push} />;
      default:          return <HomeScreen onNav={nav} push={push} loggedIn={loggedIn} onAuth={onAuth} />;
    }
  };

  return (
    <div style={{
      width: "100%",
      height: "100dvh",
      maxHeight: "100dvh",
      maxWidth: 480,
      margin: "0 auto",
      background: C.bg1,
      position: "relative",
      overflow: "hidden",
      isolation: "isolate",
    }}>
      {render()}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={onAuthSuccess} />}
      {showChallenge && (
        <ChallengePopup
          onClose={() => setShowChallenge(false)}
          onEnter={() => { setShowChallenge(false); nav("challenge"); }}
          imgSrc={undefined}
          idx={slideIdx}
          setIdx={(updater) => setSlideIdx(updater)}
        />
      )}
    </div>
  );
}
