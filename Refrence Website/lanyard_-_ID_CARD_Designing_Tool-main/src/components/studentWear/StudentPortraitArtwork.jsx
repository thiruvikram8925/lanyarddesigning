import characterStudent from '../../assets/student-3d.png';

export default function StudentPortraitArtwork() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95)_0%,rgba(238,242,247,0.95)_50%,rgba(225,232,242,0.95)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_34%)]" />
      
      <img
        src={characterStudent}
        alt="Student Illustration"
        className="absolute left-1/2 top-[9%] z-[1] w-[106%] max-w-none -translate-x-1/2 select-none pointer-events-none"
        draggable={false}
      />
      
      {/* Decorative background shape to match the old style but cleaner */}
      <div className="absolute bottom-0 left-1/2 h-24 w-[150%] -translate-x-1/2 rounded-t-[100%] bg-[linear-gradient(180deg,rgba(148,163,184,0)_0%,rgba(148,163,184,0.08)_38%,rgba(148,163,184,0.18)_100%)] opacity-30" />
    </div>
  );
}
