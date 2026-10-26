/* eslint-disable @next/next/no-img-element -- the admin renders outside next/image's config */
/** The login-screen logo: the pin mark and the directory's name. */
export default function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <img src="/favicon.svg" alt="" width={56} height={56} />
      <div style={{ lineHeight: 1.15, color: "#0e3d47" }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em" }}>Bulbula Directory</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#8a5300" }}>BOLE BULBULA · ADMIN</div>
      </div>
    </div>
  );
}
