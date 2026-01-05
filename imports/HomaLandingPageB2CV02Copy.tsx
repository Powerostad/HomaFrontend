import svgPaths from "./svg-ws8dxesje6";

function Layout() {
  return <div className="absolute bg-[#f2f2f7] h-[851.729px] left-0 top-0 w-[392.937px]" data-name="Layout" />;
}

function ImageWithFallback() {
  return <div className="absolute h-[425.316px] left-0 top-0 w-[392.937px]" data-name="ImageWithFallback" />;
}

function Container() {
  return <div className="absolute bg-gradient-to-b from-[rgba(0,0,0,0.2)] h-[425.316px] left-0 opacity-80 to-[rgba(0,0,0,0.9)] top-0 via-50% via-[rgba(0,0,0,0)] w-[392.937px]" data-name="Container" />;
}

function Container1() {
  return <div className="absolute bg-[rgba(0,0,0,0.1)] h-[425.316px] left-0 top-0 w-[392.937px]" data-name="Container" />;
}

function StudioStartPage() {
  return (
    <div className="absolute h-[425.316px] left-0 top-0 w-[392.937px]" data-name="StudioStartPage">
      <ImageWithFallback />
      <Container />
      <Container1 />
    </div>
  );
}

function Text() {
  return (
    <div className="absolute h-[39.993px] left-[66.16px] shadow-[0px_10px_60px_0px_rgba(0,0,0,0.5)] top-0 w-[107.084px]" data-name="Text">
      <p className="absolute font-['Vazirmatn:Black',sans-serif] font-black leading-[40px] left-[54px] text-[#ccc5ff] text-[40px] text-center text-nowrap top-[-1.07px] translate-x-[-50%]" dir="auto">
        جادویِ
      </p>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[71.995px] left-0 shadow-[0px_10px_80px_0px_rgba(0,0,0,0.5)] top-[35px] w-[239.394px]" data-name="Heading 2">
      <p className="absolute font-['Vazirmatn:Black',sans-serif] font-black leading-[72px] left-[120px] text-[#cdc5ff] text-[80px] text-center text-nowrap top-[-1.44px] tracking-[-2px] translate-x-[-50%]" dir="auto">
        فضـــــا
      </p>
    </div>
  );
}

function StudioStartPage1() {
  return (
    <div className="h-[106.998px] relative shrink-0 w-[239.394px]" data-name="StudioStartPage">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text />
        <Heading />
      </div>
    </div>
  );
}

function StudioStartPage2() {
  return (
    <div className="h-[14.989px] relative shrink-0 w-[57.589px]" data-name="StudioStartPage">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Vazirmatn:Bold',sans-serif] font-bold leading-[15px] left-[29.5px] text-[10px] text-[rgba(255,255,255,0.4)] text-center text-nowrap top-[-1.1px] tracking-[3px] translate-x-[-50%] uppercase" dir="auto">
          بهبود هوشمند
        </p>
      </div>
    </div>
  );
}

function StudioStartPage3() {
  return (
    <div className="h-[20.991px] relative shrink-0 w-[194.205px]" data-name="StudioStartPage">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Vazirmatn:Bold',sans-serif] font-bold leading-[21px] left-[97.5px] text-[14px] text-[rgba(255,255,255,0.9)] text-center text-nowrap top-[-1.1px] tracking-[0.7px] translate-x-[-50%]" dir="auto">
          بهبود چیدمان و آیتم‌ها با یک عکس
        </p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[206.964px] relative shrink-0 w-[293.193px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[23.993px] items-center relative size-full">
        <StudioStartPage1 />
        <StudioStartPage2 />
        <StudioStartPage3 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[19.997px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9967 19.9967">
        <g id="Icon">
          <path d={svgPaths.p3f2fe200} stroke="var(--stroke-0, black)" strokeWidth="2" />
          <path d={svgPaths.p2669bb80} id="Vector" stroke="var(--stroke-0, #CDC5FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66639" />
          <path d={svgPaths.p18421500} id="Vector_2" stroke="var(--stroke-0, #CDC5FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66639" />
        </g>
      </svg>
    </div>
  );
}

function Text1() {
  return (
    <div className="basis-0 grow h-[29.086px] min-h-px min-w-px relative shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0px_0px_1.098px] border-[rgba(255,255,255,0.3)] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Vazirmatn:Black',sans-serif] font-black leading-[24px] left-[37.5px] text-[16px] text-center text-nowrap text-white top-[-1.1px] tracking-[-0.4px] translate-x-[-50%]" dir="auto">
          شروع تغییر
        </p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[29.086px] relative shrink-0 w-[105.18px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.988px] items-center relative size-full">
        <Icon />
        <Text1 />
      </div>
    </div>
  );
}

function StudioStartPage4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32.104px] h-[425.316px] items-center justify-center left-0 pb-0 pt-[61.191px] px-0 top-0 w-[392.937px]" data-name="StudioStartPage">
      <Container2 />
      <Button />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute border-[0px_0px_1.098px] border-[rgba(255,255,255,0.05)] border-solid h-[389px] left-[-1px] overflow-clip top-[216px] w-[393px]" data-name="Container">
      <StudioStartPage />
      <StudioStartPage4 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[431px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[26.93%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392.937 198.838">
          <path d={svgPaths.p36833b80} fill="var(--fill-0, black)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col h-[851.729px] items-start left-0 opacity-[0.12] top-0 w-[392.937px]" data-name="Container">
      <Icon1 />
    </div>
  );
}

function StudioStartPage5() {
  return (
    <div className="absolute bg-black h-[851.729px] left-0 overflow-clip top-0 w-[392.937px]" data-name="StudioStartPage">
      <Container3 />
      <Container4 />
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute h-[28.006px] left-[229.64px] top-[15.98px] w-[83.348px]" data-name="Logo">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[28px] text-nowrap text-white top-[-0.29px] tracking-[-1.5px] uppercase">HOMA</p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%_16.67%_79.17%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-0.62px_-4.69%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.5809 1.24979">
            <path d="M0.624897 0.624897H13.956" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[16.67%] right-[16.67%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-0.62px_-4.69%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.5809 1.24979">
            <path d="M0.624897 0.624897H13.956" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[79.17%_16.67%_20.83%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-0.62px_-4.69%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.5809 1.24979">
            <path d="M0.624897 0.624897H13.956" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col h-[19.997px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon2 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pb-0 pt-[7.992px] px-[7.992px] size-[35.98px] top-[12px]" data-name="Button">
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[59.99px] left-[23.99px] top-0 w-[312.984px]" data-name="Container">
      <Logo />
      <Button1 />
    </div>
  );
}

function Header() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] h-[59.99px] left-[15.98px] overflow-clip rounded-[30px] shadow-[0px_15px_35px_0px_rgba(255,255,255,0.15)] top-[15.98px] w-[360.97px]" data-name="Header">
      <Container6 />
    </div>
  );
}

export default function HomaLandingPageB2CV02Copy() {
  return (
    <div className="bg-[#f2f2f7] relative size-full" data-name="Homa.LandingPage.B2C.V.02 (Copy)">
      <Layout />
      <StudioStartPage5 />
      <Header />
    </div>
  );
}