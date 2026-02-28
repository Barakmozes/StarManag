"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useKeenSlider, KeenSliderPlugin } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { HiStar } from "react-icons/hi2";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsCalendarCheck } from "react-icons/bs";
import { User } from "@prisma/client";
import RestaurantDetailsModal from "./RestaurantDetailsModal";
import ReservationBookingModal from "./ReservationBookingModal";

/**
 * Autoplay plugin for Keen Slider
 */
function Autoplay(delay = 3000): KeenSliderPlugin {
  let timer: ReturnType<typeof setTimeout>;

  return (slider) => {
    const clear = () => clearTimeout(timer);
    const next = () => {
      clear();
      timer = setTimeout(() => slider.next(), delay);
    };

    slider.on("created", next);
    slider.on("animationEnded", next);
    slider.on("updated", next);
    slider.on("dragStarted", clear);
    slider.on("destroyed", clear);
  };
}

type Props = { user: User | null };

export default function HeroSection({ user }: Props) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const slides = ["/img/banner5.jpg", "/img/banner6.jpg", "/img/banner4.jpg"];

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: { perView: 1, spacing: 0 },
    },
    [Autoplay(5000)]
  );

  return (
    <section className="relative overflow-hidden h-[18rem] sm:h-72 md:h-96">
      {/* Carousel */}
      <div
        ref={sliderRef}
        className="relative h-[12rem] sm:h-48 md:h-72 w-full keen-slider bg-no-repeat bg-cover"
        role="region"
        aria-label="Hero carousel"
      >
        {slides.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="keen-slider__slide relative w-full"
          >
            <Image
              src={src}
              alt={`Slide ${idx + 1}`}
              fill
              sizes="100vw"
              priority={idx === 0}
              className="object-cover object-top-right"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <button
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 backdrop-blur hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-4"
        onClick={() => instanceRef.current?.prev()}
        type="button"
      >
        <FaChevronLeft className="h-5 w-5 text-gray-800 sm:h-6 sm:w-6" />
      </button>

      <button
        aria-label="Next slide"
        className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 backdrop-blur hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-4"
        onClick={() => instanceRef.current?.next()}
        type="button"
      >
        <FaChevronRight className="h-5 w-5 text-gray-800 sm:h-6 sm:w-6" />
      </button>

   {/* Overlay (glass blur fading up) */}
<div className="absolute inset-x-0 bottom-0 z-10">
  {/* שכבת טשטוש מדורגת */}
  <div
className="
  pointer-events-none absolute inset-x-0 bottom-0
  h-44 sm:h-40 md:h-44
  bg-gradient-to-t from-white/80 via-white/40 to-sky-50/0
  backdrop-blur-lg
  [mask-image:linear-gradient(to_top,black_0%,black_60%,transparent_100%)]
  [-webkit-mask-image:linear-gradient(to_top,black_0%,black_60%,transparent_100%)]
"



  />

  {/* תוכן מעל הטשטוש (נשאר חד) */}
  <div className="relative mx-3 mb-3 flex items-center gap-4">
    <div className="h-16 w-16 overflow-hidden rounded-full bg-white p-1 ring-2 ring-white sm:h-24 sm:w-24">
      <Image
        src="/img/logo.png"
        alt="Dps-logo"
        width={96}
        height={96}
        className="h-full w-full object-contain"
      />
    </div>

    <div className="min-w-0">
      <h1 className="flex flex-wrap text-3xl textcolor sm:text-4xl md:text-5xl leading-none">
        {"StarManag".split("").map((c, i) => (
          <span
            key={i}
            className="inline-block animate-pop-in text-black"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {c}
          </span>
        ))}
      </h1>

      <div className="mt-1 flex items-center">
        <HiStar className="h-5 w-5 text-yellow-400" />
        <span className="ml-1 text-sm text-black sm:text-base">4.5 rating</span>
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <RestaurantDetailsModal />
        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-green-700 active:scale-95 sm:text-sm"
        >
          <BsCalendarCheck size={14} />
          Reserve a Table
        </button>
      </div>
    </div>
  </div>
</div>

      <ReservationBookingModal
        user={user}
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </section>
  );
}
