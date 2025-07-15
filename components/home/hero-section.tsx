import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionSection,
  MotionSpan,
} from "../common/motion-wrapper";
import { containerVariants, itemVariants } from "@/utils/contants";

const buttonVariants = {
  scale: 1.05,
  transition: {
    type: "spring",
    damping: 10,
    stiffness: 300,
  },
};

export default function HeroSection() {
  return (
    <MotionSection
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative mx-auto flex flex-col z-0 items-center justify-center py-16 sm:py-20 lg:pb-28 transition-all animate-in lg:px-12 max-w-7xl">
        <MotionDiv
          variants={itemVariants}
          className="relative p-[1px] overflow-hidden rounded-full bg-gradient-to-r from-rose-200 via-rose-500 to-rose-800 group"
        >
          <Badge
            variant={"secondary"}
            className="relative px-6 py-2 text-base font-medium bg-white rounded-full group-hover:bg-gray-50 transition-colors duration-200"
          >
            <Sparkles className="h-6 w-6 mr-2 text-rose-600 animate-pulse" />
            <p className="text-base text-rose-600">Powered by AI</p>
          </Badge>
        </MotionDiv>

        <MotionH1
          variants={itemVariants}
          className="font-bold py-6 text-center text-4xl sm:text-5xl lg:text-6xl"
        >
          Transform Any PDF Into Key Insights
          <span className="relative inline-block">
            <MotionSpan
              whileHover={buttonVariants}
              className="relative z-10 px-2"
            >
              Insights
            </MotionSpan>{" "}
            <span
              className="absolute inset-0 bg-rose-200/50 -rotate-2 rounded-lg transform -skew-y-1"
              aria-hidden="true"
            ></span>
          </span>
          in Seconds
        </MotionH1>
        <MotionH2
          variants={itemVariants}
          className="text-lg sm:text-xl lg:text-2xl text-center px-4 lg:px-0 lg:max-w-4xl text-gray-600"
        >
          AI-powered document summarization that saves you hours of reading time
        </MotionH2>
        <MotionDiv variants={itemVariants} whileHover={buttonVariants}>
          <Button
            variant={"link"}
            className="text-white mt-6 text-base sm:text-lg lg:text-lg rounded-full px-8 sm:px-10 lg:px-8 py-6 sm:py-7 lg:py-6 lg:mt-16 bg-linear-to-r from-slate-900 to-rose-500 hover:from-rose-500 hover:to-slate-900 font-bold hover:no-underline shadow-lg transition-all duration-300"
          >
            <Link href="/#pricing" className="flex gap-2 items-center">
              <span>
                <ArrowRight className="animate-pulse" />
              </span>
              Try Summarize Ai
            </Link>
          </Button>
        </MotionDiv>
      </div>
    </MotionSection>
  );
}
