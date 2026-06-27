import { Database, CheckCircle2, Globe, ExternalLink, ShieldCheck } from 'lucide-react';

export default function AdminLedger() {
  const ledgerBatches = [
    {
      id: 'batch_01',
      rootHash: '0x3a5f9db4e8156102f03jsnf7f88ef6548b25d4aeed1aa1f21c3bd8a600c63a4',
      polygonTx: '0x992b8d447a164c8b25d4aeed1aa1f21c3bd8a600c63a42c9fa6aedb70bacc978',
      block: 3829103,
      status: 'SUCCESS',
      timestamp: '2026-06-20 18:00:22',
      recordsCount: 14
    },
    {
      id: 'batch_02',
      rootHash: '0x9f2a71d88ef6548b25d4aeed1aa1f21c3bd8a600c63a42c9fa6aedb70bacc97',
      polygonTx: '0x112aeed1aa1f21c3bd8a600c63a42c9fa6aedb70bacc9786473c6aa7a6910d3ab',
      block: 3828945,
      status: 'SUCCESS',
      timestamp: '2026-06-20 16:15:40',
      recordsCount: 8
    },
    {
      id: 'batch_03',
      rootHash: '0xbd8a600c63a42c9fa6aedb70bacc9786473c6aa7a6910d3ab25d4aeed1aa1f2',
      polygonTx: '0x553bd8a600c63a42c9fa6aedb70bacc9786473c6aa7a6910d3ab25d4aeed1aa1f',
      block: 3828112,
      status: 'SUCCESS',
      timestamp: '2026-06-20 12:40:11',
      recordsCount: 22
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Blockchain Ledger Audit
        </h1>
        <p className="text-sm text-slate-500">
          Theo dõi các lô giao dịch tài chính đã được băm nhúng Merkle Root chốt lên Polygon Amoy Testnet.
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-4 flex gap-3 text-emerald-800 dark:text-emerald-400">
        <ShieldCheck size={24} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Tính năng đối soát hợp đồng thông minh đang kích hoạt</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-500/90 leading-relaxed">
            Mọi giao dịch phân chia doanh thu giữa Nền tảng, Gian hàng (Shop Owner), và Người tiếp thị liên kết (Affiliate Creator) được kết hợp thành cây Merkle và đẩy lên smart contract ở địa chỉ <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded font-mono font-bold">0x3C6Aa64...F2</code>.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-850 text-xs font-semibold text-slate-400 uppercase">
                <th className="px-6 py-4">Mã Batch</th>
                <th className="px-6 py-4">Merkle Root Hash</th>
                <th className="px-6 py-4">Polygon Tx / Block</th>
                <th className="px-6 py-4">Số Bản ghi</th>
                <th className="px-6 py-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-sm">
              {ledgerBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {batch.id.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                    {batch.rootHash}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    <a 
                      href={`https://amoy.polygonscan.com/tx/${batch.polygonTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-brand-500 hover:underline flex items-center gap-1"
                    >
                      {batch.polygonTx.slice(0, 10)}...{batch.polygonTx.slice(-8)}
                      <ExternalLink size={12} />
                    </a>
                    <div className="text-[10px] text-slate-450 dark:text-slate-550 flex items-center gap-1">
                      <Globe size={10} /> Block #{batch.block}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {batch.recordsCount} Tx
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle2 size={12} /> {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
