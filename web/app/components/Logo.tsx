import { Link } from "react-router"

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2 py-2">
      <div className="flex size-8 items-center justify-center rounded-full border-2 border-[#8B4513] shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#8B4513]"
        >
          <path
            d="M50 20C54 20 57 23 57 27C57 31 54 34 50 34"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M25 45L50 34L75 45"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M30 45V80 M50 45V80 M70 45V80"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-bold text-base uppercase tracking-wider">
        IDrobe
      </span>
    </Link>
  )
}