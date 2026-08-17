import { HowItWorks } from '../features/home/HowItWorks';
import { FeatureHighlights } from '../features/home/FeatureHighlights';
import { Faq } from '../features/home/Faq';

export function HowItWorksPage() {
  return (
    <>
      <HowItWorks />
      <FeatureHighlights />
      <Faq />
    </>
  );
}
