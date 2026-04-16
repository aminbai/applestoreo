import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (isOpen && !isScanning) {
      startScanner();
    }
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setIsScanning(true);

      // Support all 1D barcode formats for IMEI scanning
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
      console.error("Scanner error:", error);
      toast.error("স্ক্যানার চালু করতে ব্যর্থ। ক্যামেরা পারমিশন চেক করুন।");
      if (mountedRef.current) {
        setIsScanning(false);
      }
      onClose();
    }
  };

  const stopScanner = async () => {
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
      setIsScanning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        stopScanner();
        onClose();
      }
    }}>
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

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                বারকোড বা IMEI বারকোড ফ্রেমের মধ্যে রাখুন
              </p>
              {isScanning && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">স্ক্যান করা হচ্ছে...</span>
                </div>
              )}
            </div>

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
