import svgPaths from "./svg-f9sfbfluw4";
const imgRectangle1 = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

function Frame4() {
  return (
    <div className="bg-[#5e5791] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[16px] shrink-0">
      <p className="font-['Vazirmatn:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-nowrap text-right text-white" dir="auto">
        دیجیکالا
      </p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0 w-full">
      <Frame4 />
      <p className="font-['Vazirmatn:Medium',sans-serif] font-medium leading-[normal] min-w-full relative shrink-0 text-[#1c1b20] text-[14px] text-right w-[min-content]" dir="auto">
        روتختی سهند کد VF21.WJ زمینه فیلی
      </p>
    </div>
  );
}

function ScaleHorizontalAlt() {
  return (
    <div className="relative size-[16px]" data-name="scale/horizontal/alt">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="scale/horizontal/alt">
          <path d={svgPaths.p1dbec000} fill="var(--stroke-0, #78767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#e5e1e9] content-stretch flex gap-[4px] items-center justify-center px-[8px] py-[4px] relative rounded-[16px] shrink-0">
      <p className="font-['Vazirmatn:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#48464f] text-[12px] text-nowrap text-right" dir="auto">
        ۴ اندازه
      </p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <ScaleHorizontalAlt />
        </div>
      </div>
    </div>
  );
}

function ColorPallete() {
  return (
    <div className="relative size-[16px]" data-name="color pallete">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="color pallete">
          <path d={svgPaths.p353aa980} fill="var(--stroke-0, #78767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#e5e1e9] content-stretch flex gap-[4px] items-center justify-center px-[8px] py-[4px] relative rounded-[16px] shrink-0">
      <p className="font-['Vazirmatn:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#48464f] text-[12px] text-nowrap text-right" dir="auto">
        ۳ رنگ
      </p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <ColorPallete />
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
      <Frame6 />
      <Frame7 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Frame5 />
      <Frame11 />
    </div>
  );
}

function LinearLikeStar() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Linear / Like / Star">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Linear / Like / Star">
          <path d={svgPaths.p25ede800} fill="var(--fill-0, #FFD700)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0">
      <div className="flex flex-col font-['Vazirmatn:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#48464f] text-[14px] text-nowrap">
        <p className="leading-[16px]" dir="auto">
          ۴.۳
        </p>
      </div>
      <LinearLikeStar />
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[#ba1a1a] content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative rounded-[8px] shrink-0">
      <p className="font-['Vazirmatn:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-white w-full" dir="auto">
        ۲۰٪
      </p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0">
      <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-['Vazirmatn:Regular',sans-serif] font-normal leading-[normal] line-through relative shrink-0 text-[#48464f] text-[14px] text-nowrap" dir="auto">
        ۲٬۹۰۰٬۰۰۰
      </p>
      <Frame3 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame9 />
      <Frame2 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[4px] items-baseline justify-end leading-[normal] relative shrink-0 text-nowrap w-full">
      <p className="font-['Vazirmatn:Regular',sans-serif] font-normal relative shrink-0 text-[#48464f] text-[14px]" dir="auto">
        تومان
      </p>
      <p className="font-['Vazirmatn:Bold',sans-serif] font-bold relative shrink-0 text-[#1c1b20] text-[18px]" dir="auto">
        ۲٬۵۶۴٬۳۹۰
      </p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Frame10 />
      <Frame1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-end min-h-px min-w-px relative shrink-0">
      <Frame8 />
      <Frame12 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[#f1ecf4] relative rounded-[24px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[rgba(120,118,127,0.08)] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="flex flex-row justify-end size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start justify-end p-[8px] relative w-full">
          <Frame />
          <div className="relative rounded-[16px] shrink-0 size-[168px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[16px]">
              <img alt="" className="absolute h-[99.97%] left-[-7.14%] max-w-none top-[0.01%] w-[114.29%]" src={imgRectangle1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Frame14() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full">
      <Frame13 />
    </div>
  );
}