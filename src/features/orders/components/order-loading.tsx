export function OrderLoading({ detail = false }: { detail?: boolean }) {
  return (
    <div className={detail ? "space-y-6 py-2" : "px-5 py-5 sm:px-6"}>
      <p role="status" className="mb-5 text-sm text-muted-foreground">
        {detail ? "Loading order details…" : "Loading orders…"}
      </p>
      <div
        aria-hidden="true"
        className="animate-pulse space-y-5 motion-reduce:animate-none"
      >
        {detail ? (
          <>
            <div className="h-28 rounded-md bg-muted" />
            <div className="h-4 w-24 rounded-sm bg-muted" />
            <div className="h-4 w-3/4 rounded-sm bg-muted" />
            <div className="h-48 rounded-md bg-muted" />
          </>
        ) : (
          Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="grid h-14 grid-cols-[1fr_2fr_1fr] items-center gap-8 border-b pb-5 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr]"
            >
              <div className="h-3 w-3/4 rounded-sm bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-2/3 rounded-sm bg-muted" />
                <div className="h-2 w-5/6 rounded-sm bg-muted" />
              </div>
              <div className="h-3 w-3/4 rounded-sm bg-muted" />
              <div className="hidden h-5 w-20 rounded-sm bg-muted sm:block" />
              <div className="hidden h-3 w-3/4 rounded-sm bg-muted sm:block" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
