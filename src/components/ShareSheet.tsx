import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { downloadJson, shareUrl } from '../lib/share';
import type { Sequence } from '../types';
import { Icon } from './icons';
import { Btn, Sheet } from './ui';

// QR 코드에 담을 수 있는 대략적인 한계 (큐잉 멘트가 길면 초과)
const QR_LIMIT = 2300;

export function ShareSheet({ seq, onClose }: { seq: Sequence; onClose: () => void }) {
  const url = shareUrl(seq);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrOk = url.length <= QR_LIMIT;

  useEffect(() => {
    if (!qrOk) return;
    QRCode.toDataURL(url, { margin: 1, width: 600, errorCorrectionLevel: 'L' }).then(setQr).catch(() => setQr(null));
  }, [url, qrOk]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Sheet open onClose={onClose} title="다른 기기로 보내기">
      <div className="space-y-4">
        {qrOk ? (
          <div className="text-center">
            {qr && <img src={qr} alt="QR 코드" className="mx-auto w-64 rounded-xl" />}
            <p className="mt-2 text-sm text-stone-500">아이패드 카메라로 찍으면 바로 열려요</p>
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">큐잉 멘트가 길어서 QR 코드에 다 안 들어가요. 링크를 복사해서 카톡이나 메모로 보내주세요.</p>
        )}
        <div className="grid gap-2">
          <Btn variant="primary" onClick={copy}><Icon name={copied ? 'check' : 'copy'} className="size-4" /> {copied ? '복사됨' : '링크 복사'}</Btn>
          {'share' in navigator && (
            <Btn onClick={() => navigator.share({ title: seq.title, url }).catch(() => {})}><Icon name="share" className="size-4" /> 공유하기</Btn>
          )}
          <Btn onClick={() => downloadJson([seq], `${seq.title}.json`)}><Icon name="download" className="size-4" /> 파일로 저장 (백업)</Btn>
        </div>
      </div>
    </Sheet>
  );
}
