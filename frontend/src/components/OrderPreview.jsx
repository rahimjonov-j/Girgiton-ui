export default function OrderPreview({ order, stored, onEdit, onSend }) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Preview</p>
          <h2 className="text-3xl font-semibold">STOL {order.stol}</h2>
          <p className="mono text-xs text-[var(--muted)]">{order.buyurtma_id}</p>
        </div>
        <div className="rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm">
          {stored ? 'Yuborildi' : 'Yangi'}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {order.mahsulotlar.map((item, index) => (
          <div key={`${item.nomi}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
            <div>
              <p className="text-lg font-medium">
                {item.nomi} x {item.miqdor}
              </p>
              <p className="text-sm text-[var(--muted)]">{item.tavsif}</p>
            </div>
            <div className="text-right">
              <p className="mono text-sm">{item.jami_narxi.toLocaleString('uz-UZ')} so'm</p>
              {item.qoshimchalar.length > 0 && (
                <p className="text-xs text-[var(--muted)]">
                  +{item.qoshimchalar.map((addon) => addon.nomi).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Jami</p>
          <p className="text-2xl font-semibold">
            {order.hisob_kitob.umumiy_summa.toLocaleString('uz-UZ')} so'm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="button-ring rounded-full border border-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onSend}
            className="button-ring rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
          >
            Send to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
}

