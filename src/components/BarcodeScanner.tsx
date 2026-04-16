import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, RefreshCw, ShieldAlert } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

type ScannerState = "idle" | "requesting" | "scanning" | "denied" | "error";

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        await scanner.stop();
      }
    } catch (error) {
      // ignore
    }
    if (mountedRef.current) {
      setScannerState("idle");
    }
  }, []);

  const requestPermissionAndStart = useCallback(async () => {
    if (!mountedRef.current) return;
    setScannerState("requesting");

    try {
      // Explicitly request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Stop the temporary stream immediately — html5-qrcode will open its own
      stream.getTracks().forEach((t) => t.stop());
    } catch (permErr: any) {
      console.error("Camera permission denied:", permErr);
      if (mountedRef.current) {
        setScannerState("denied");
      }
      return;
    }

    // Permission granted — start scanner
    try {
      if (!mountedRef.current) return;
      setScannerState("scanning");

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ];

      scannerRef.current = new Html5Qrcode("barcode-reader", {
        formatsToSupport,
        verbose: false,
      });

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 120 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          toast.success("বারকোড স্ক্যান সফল!");
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {}
      );
    } catch (error: any) {
      console.error("Scanner start error:", error);
      if (mountedRef.current) {
        setScannerState("error");
      }
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      // Small delay to ensure the dialog DOM is rendered before scanner mounts
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          requestPermissionAndStart();
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        stopScanner();
      };
    }
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          stopScanner();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>বারকোড / IMEI স্ক্যান</DialogTitle>
        </DialogHeader>

        <Card className="p-4">
          <div className="space-y-4">
            <div
              id="barcode-reader"
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: "300px" }}
            />

            {/* Permission denied state */}
            {scannerState === "denied" && (
              <div className="text-center space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <ShieldAlert className="w-10 h-10 mx-auto text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  ক্যামেরা অনুমতি প্রত্যাখ্যাত
                </p>
                <p className="text-xs text-muted-foreground">
                  ব্রাউজারের অ্যাড্রেস বারে 🔒 আইকনে ক্লিক করে ক্যামেরা অনুমতি "Allow" করুন, তারপর আবার চেষ্টা করুন।
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermissionAndStart}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  আবার চেষ্টা করুন
                </Button>
              </div>
            )}

            {/* Error state */}
            {scannerState === "error" && (
              <div className="text-center space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <Camera className="w-10 h-10 mx-auto text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  স্ক্যানার চালু করতে ব্যর্থ
                </p>
                <p className="text-xs text-muted-foreground">
                  ক্যামেরা অন্য অ্যাপে ব্যবহৃত হতে পারে। অন্য ক্যামেরা অ্যাপ বন্ধ করে আবার চেষ্টা করুন।
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermissionAndStart}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  আবার চেষ্টা করুন
                </Button>
              </div>
            )}

            {/* Requesting permission */}
            {scannerState === "requesting" && (
              <div className="text-center space-y-2 p-4">
                <Camera className="w-8 h-8 mx-auto text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  ক্যামেরা অনুমতি চাওয়া হচ্ছে...
                </p>
                <p className="text-xs text-muted-foreground">
                  ব্রাউজারের পপআপে "Allow" বাটনে ক্লিক করুন
                </p>
              </div>
            )}

            {/* Scanning state */}
            {scannerState === "scanning" && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  বারকোড বা IMEI বারকোড ফ্রেমের মধ্যে রাখুন
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">স্ক্যান করা হচ্ছে...</span>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="w-full"
            >
              বাতিল
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
