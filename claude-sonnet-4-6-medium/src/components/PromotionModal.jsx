import { UNICODE_PIECES } from '../engine/pieces.js'

const PROMOTION_PIECES = ['Q', 'R', 'B', 'N']

export default function PromotionModal({ color, onChoose }) {
  const symbols = UNICODE_PIECES[color]

  return (
    <div className="promotion-overlay">
      <div className="promotion-modal">
        <h3>Choose promotion piece</h3>
        <div className="promotion-choices">
          {PROMOTION_PIECES.map((type) => (
            <button
              key={type}
              className={`promotion-choice piece-${color}`}
              onClick={() => onChoose(type)}
              title={type}
            >
              {symbols[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
