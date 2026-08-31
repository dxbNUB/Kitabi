/**
 * Kitabi wordmark — bilingual brand mark.
 * Latin "kitabi" set in Cormorant Garamond, Arabic "كتابي" beneath in Reem Kufi.
 *
 * Variants:
 *   default  — full size (Latin 26px / Arabic 12px)
 *   mini     — condensed nav state (Latin 22px / Arabic 10px)
 */
export default function KitabiLogo({ variant = 'default', as: Tag = 'a', href = '/', className = '', ...rest }) {
  const isMini = variant === 'mini';

  return (
    <Tag
      href={Tag === 'a' ? href : undefined}
      aria-label="Kitabi home"
      className={`inline-flex flex-col items-start leading-none gap-[2px] no-underline ${className}`}
      {...rest}
    >
      <span
        className={`font-display font-medium text-kitabi-gold tracking-[0.09em]
          ${isMini ? 'text-[22px]' : 'text-[26px]'}`}
      >
        kitabi
      </span>
      <span
        dir="rtl"
        className={`font-arabic font-normal -translate-y-[1px]
          ${isMini ? 'text-[10px]' : 'text-[12px]'}`}
        style={{ color: 'rgba(201, 162, 92, 0.65)' }}
      >
        كتابي
      </span>
    </Tag>
  );
}
