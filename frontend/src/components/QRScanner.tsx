import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { QrCode, Camera, X, MapPin, Video, ExternalLink } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface EquipmentData {
  id: string;
  name: string;
  status: 'in-stock' | 'rented';
  location?: {
    shelf: string;
    number: string;
  };
  rentedBy?: string;
  returnDate?: string;
  tutorialLink?: string;
}

// Mock equipment database
const equipmentDatabase: Record<string, EquipmentData> = {
  'EQ-CAM-001': {
    id: 'EQ-CAM-001',
    name: 'Sony A7S III',
    status: 'in-stock',
    location: { shelf: 'Camera Bay A', number: 'Shelf 2, Bin 3' },
    tutorialLink: 'tutorials',
  },
  'EQ-CAM-002': {
    id: 'EQ-CAM-002',
    name: 'Canon EOS R5',
    status: 'rented',
    rentedBy: 'John Smith',
    returnDate: '2025-11-14',
    tutorialLink: 'tutorials',
  },
  'EQ-AUD-001': {
    id: 'EQ-AUD-001',
    name: 'Rode NTG4+ Microphone',
    status: 'in-stock',
    location: { shelf: 'Audio Equipment', number: 'Shelf 1, Bin 5' },
    tutorialLink: 'tutorials',
  },
  'EQ-LGT-001': {
    id: 'EQ-LGT-001',
    name: 'Aputure 300d II',
    status: 'in-stock',
    location: { shelf: 'Lighting Bay', number: 'Shelf 3, Bin 1' },
    tutorialLink: 'tutorials',
  },
};

export function QRScanner({ open, onClose, onNavigate }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<EquipmentData | null>(null);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulate QR code scanning (in production, use a library like html5-qrcode)
  const simulateScan = () => {
    // Randomly select an equipment item for demo
    const equipmentIds = Object.keys(equipmentDatabase);
    const randomId = equipmentIds[Math.floor(Math.random() * equipmentIds.length)];
    const data = equipmentDatabase[randomId];
    
    setScannedData(data);
    setIsScanning(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      setError('');
      setScannedData(null);
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not available in this environment. Using demo mode.');
        // Simulate scan after showing message
        setTimeout(() => {
          simulateScan();
        }, 1500);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsScanning(true);
      
      // Simulate scanning after 2 seconds for demo
      setTimeout(() => {
        if (isScanning) {
          simulateScan();
        }
      }, 2000);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setError('Camera access denied. Using demo mode instead.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Using demo mode instead.');
      } else {
        setError('Camera unavailable. Using demo mode instead.');
      }
      // Simulate scan in demo mode
      setTimeout(() => {
        simulateScan();
      }, 1500);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    setScannedData(null);
    setError('');
    onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-teal-400" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Scan equipment QR codes to check location and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {!scannedData && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-teal-500/50">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-teal-500">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-teal-400" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-teal-400" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-teal-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-teal-400" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <p className="text-sm text-white bg-black/70 px-4 py-2 rounded-full">
                        Align QR code within frame
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Camera className="h-16 w-16 text-gray-600 mb-4" />
                    <p className="text-gray-400 mb-4">
                      Click the button below to start scanning
                    </p>
                    {error && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <p className="text-yellow-400 text-sm">{error}</p>
                        <p className="text-xs text-gray-400 mt-1">Simulating QR scan...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isScanning ? (
                  <Button
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                    onClick={startCamera}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={stopCamera}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Scan
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Scanned Result */}
          {scannedData && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{scannedData.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      ID: {scannedData.id}
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      scannedData.status === 'in-stock'
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    }
                  >
                    {scannedData.status === 'in-stock' ? 'Available' : 'Rented'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scannedData.status === 'in-stock' && scannedData.location && (
                  <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
                        <MapPin className="h-5 w-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Location</p>
                        <p className="text-white">{scannedData.location.shelf}</p>
                        <p className="text-sm text-gray-300">{scannedData.location.number}</p>
                      </div>
                    </div>
                  </div>
                )}

                {scannedData.status === 'rented' && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400 mb-2">Currently Rented</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">By: {scannedData.rentedBy}</p>
                      <p className="text-gray-300">Return Date: {scannedData.returnDate}</p>
                    </div>
                  </div>
                )}

                {scannedData.tutorialLink && (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    onClick={() => {
                      handleClose();
                      onNavigate('tutorials');
                    }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    View Tutorial for this Equipment
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => setScannedData(null)}
                  >
                    Scan Another
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
