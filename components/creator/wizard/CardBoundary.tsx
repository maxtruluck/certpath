export default function CardBoundary({ cardNumber, totalCards }: {
  cardNumber: number
  totalCards: number
}) {
  return (
    <div className="relative flex items-center my-4">
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <span className="mx-3 px-2.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full whitespace-nowrap">
        Card {cardNumber} of {totalCards}
      </span>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </div>
  )
}
