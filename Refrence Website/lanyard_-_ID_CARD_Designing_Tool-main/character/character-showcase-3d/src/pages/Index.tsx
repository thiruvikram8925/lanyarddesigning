import student from "@/assets/student-3d.png";

const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 overflow-hidden">
      <div className="perspective-scene relative">
        {/* Character */}
        <div className="relative character-float">
          {/* BACK lanyard layer — sits behind the character (behind neck/shoulders) */}
          <svg
            viewBox="0 0 420 600"
            className="absolute inset-0 w-[420px] h-[600px] pointer-events-none z-0"
            style={{ top: 0, left: 0, filter: "blur(0.4px)" }}
          >
            <defs>
              <linearGradient id="strapBack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(200 55% 22%)" />
                <stop offset="50%" stopColor="hsl(200 65% 32%)" />
                <stop offset="100%" stopColor="hsl(200 55% 20%)" />
              </linearGradient>
              <path id="backArc" d="M 188 150 C 193 110, 227 110, 232 150" />
            </defs>
            <use href="#backArc" stroke="url(#strapBack)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.9" />
            <use href="#backArc" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" transform="translate(0,1.5)" opacity="0.6" />
            <text fontSize="3.2" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif" letterSpacing="0.8">
              <textPath href="#backArc" startOffset="6%">STUDENT · STUDENT · STUDENT</textPath>
            </text>
          </svg>

          <img
            src={student}
            alt="3D student character with lanyard ID card"
            width={420}
            height={420}
            className="relative z-[1] w-[420px] h-auto drop-shadow-2xl select-none pointer-events-none"
          />

          {/* OCCLUSION SHADOW layer — soft shadow the front straps cast on the hoodie */}
          <svg
            viewBox="0 0 420 600"
            className="absolute inset-0 w-[420px] h-[600px] pointer-events-none z-[5]"
            style={{ top: 0, left: 0, filter: "blur(2.5px)", opacity: 0.55 }}
          >
            <path d="M 196 156 Q 199 188 209 218" stroke="rgba(0,0,0,0.55)" strokeWidth="9" fill="none" strokeLinecap="round" />
            <path d="M 224 156 Q 221 188 211 218" stroke="rgba(0,0,0,0.55)" strokeWidth="9" fill="none" strokeLinecap="round" />
          </svg>

          {/* FRONT lanyard layer — straps in front of body, V down to clip */}
          <svg
            viewBox="0 0 420 600"
            className="absolute inset-0 w-[420px] h-[600px] pointer-events-none z-10"
            style={{ top: 0, left: 0 }}
          >
            <defs>
              {/* Cross-strap gradient (left edge dark → middle bright → right edge dark) gives ribbon a rounded look */}
              <linearGradient id="strapFront" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="hsl(200 70% 38%)" />
                <stop offset="50%" stopColor="hsl(200 92% 68%)" />
                <stop offset="100%" stopColor="hsl(200 70% 38%)" />
              </linearGradient>
              <linearGradient id="strapFront2" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="hsl(200 70% 36%)" />
                <stop offset="50%" stopColor="hsl(200 92% 66%)" />
                <stop offset="100%" stopColor="hsl(200 70% 36%)" />
              </linearGradient>
              <path id="leftFront" d="M 192 152 Q 195 190 207 220" />
              <path id="rightFront" d="M 228 152 Q 225 190 213 220" />
            </defs>

            {/* === LEFT ribbon strap === */}
            <use href="#leftFront" stroke="url(#strapFront)" strokeWidth="8" fill="none" strokeLinecap="butt" />
            {/* bottom edge shadow */}
            <use href="#leftFront" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none" transform="translate(1.6,0.8)" opacity="0.7" />
            {/* top highlight */}
            <use href="#leftFront" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" fill="none" transform="translate(-1.6,-0.8)" />
            {/* repeating text on left strap */}
            <text fontSize="3" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif" fontWeight="700" letterSpacing="0.4">
              <textPath href="#leftFront" startOffset="2%">STUDENT·ID·STUDENT·ID</textPath>
            </text>

            {/* === RIGHT ribbon strap === */}
            <use href="#rightFront" stroke="url(#strapFront2)" strokeWidth="8" fill="none" strokeLinecap="butt" />
            <use href="#rightFront" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none" transform="translate(1.6,0.8)" opacity="0.7" />
            <use href="#rightFront" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" fill="none" transform="translate(-1.6,-0.8)" />
            <text fontSize="3" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif" fontWeight="700" letterSpacing="0.4">
              <textPath href="#rightFront" startOffset="2%">STUDENT·ID·STUDENT·ID</textPath>
            </text>

            {/* === Black plastic buckle at the V (like reference) === */}
            <g>
              {/* buckle body */}
              <rect x="204" y="218" width="13" height="10" rx="2" fill="hsl(0 0% 12%)" stroke="hsl(0 0% 5%)" strokeWidth="0.5" />
              {/* highlight strip */}
              <rect x="205" y="219" width="11" height="1.4" rx="0.7" fill="hsl(0 0% 35%)" opacity="0.9" />
              {/* center round detail */}
              <circle cx="210.5" cy="223" r="1.8" fill="hsl(0 0% 22%)" stroke="hsl(0 0% 5%)" strokeWidth="0.4" />
              <circle cx="210.5" cy="223" r="0.8" fill="hsl(0 0% 8%)" />
              {/* small loop tab below buckle */}
              <rect x="208" y="228" width="5" height="3.5" rx="0.8" fill="hsl(0 0% 16%)" stroke="hsl(0 0% 5%)" strokeWidth="0.3" />

              {/* === Metal swivel hook + ring connecting to card === */}
              <rect x="209.5" y="231.5" width="2" height="2" fill="hsl(0 0% 70%)" />
              <circle cx="210.5" cy="235" r="2.2" fill="none" stroke="hsl(0 0% 78%)" strokeWidth="0.9" />
              <path
                d="M 209 237 Q 208.3 239 210 239.6 L 211 239.6 Q 212.7 239 212 237 Z"
                fill="hsl(0 0% 80%)"
                stroke="hsl(0 0% 45%)"
                strokeWidth="0.3"
              />
              <line x1="210.5" y1="239.6" x2="210.5" y2="242" stroke="hsl(0 0% 55%)" strokeWidth="0.8" />
            </g>
          </svg>

          {/* ID Card with sway + perspective */}
          <div
            className="absolute badge-sway z-20"
            style={{
              top: "242px",
              left: "50%",
              marginLeft: "-24px",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Soft contact shadow cast onto the hoodie behind the card */}
            <div
              className="absolute -z-10 rounded-md bg-black/35 blur-md"
              style={{
                width: "52px",
                height: "68px",
                top: "5px",
                left: "-1px",
                transform: "rotateX(8deg) rotateY(-6deg) translateZ(-2px)",
              }}
            />
            <div
              className="relative w-[48px] h-[66px] rounded-md bg-white shadow-2xl overflow-hidden border border-slate-200"
              style={{
                transform: "rotateX(10deg) rotateY(-8deg)",
                boxShadow:
                  "0 6px 10px -3px rgba(0,0,0,0.30), 0 2px 4px -1px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {/* Header band */}
              <div className="h-2.5 bg-gradient-to-r from-sky-600 to-sky-400 flex items-center justify-center">
                <span className="text-[3.5px] font-bold tracking-widest text-white">
                  ID
                </span>
              </div>

              {/* Photo */}
              <div className="mx-auto mt-1 w-4 h-4 rounded-sm bg-gradient-to-br from-amber-200 to-amber-400 border border-white shadow-sm flex items-center justify-center text-[6px]">
                🎓
              </div>

              {/* Info */}
              <div className="px-1 mt-1 text-center">
                <div className="h-[1.2px] bg-slate-300 rounded-full" />
                <div className="mt-0.5 h-[1.2px] w-3/4 mx-auto bg-slate-200 rounded-full" />
                <div className="mt-0.5 h-[1.2px] w-2/3 mx-auto bg-slate-200 rounded-full" />

                {/* Barcode */}
                <div className="mt-1 flex gap-[0.8px] justify-center items-end h-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-800"
                      style={{
                        width: i % 3 === 0 ? "0.8px" : "0.6px",
                        height: i % 4 === 0 ? "100%" : "80%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Animated glossy highlight that shifts with the sway */}
              <div className="absolute inset-0 pointer-events-none gloss-shimmer" />
            </div>

            {/* Card shadow on body */}
            <div className="absolute inset-x-2 -bottom-1 h-2 rounded-full bg-black/20 blur-md" />
          </div>
        </div>

        {/* Floor shadow */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-64 h-6 rounded-[50%] bg-black/25 blur-xl" />
      </div>
    </main>
  );
};

export default Index;
