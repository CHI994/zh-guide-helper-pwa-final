import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath: string | null;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imagePath,
  title = "圖片預覽"
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && imagePath) {
      loadImage();
    } else {
      setImageUrl(null);
      setError(null);
    }
  }, [isOpen, imagePath]);

  const loadImage = async () => {
    if (!imagePath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data } = supabase.storage
        .from('withdrawal-certificates')
        .getPublicUrl(imagePath);

      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error('Unexpected error loading image:', err);
      setError('載入圖片時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imagePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('withdrawal-certificates')
        .download(imagePath);

      if (error) {
        console.error('Error downloading image:', error);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = imagePath.split('/').pop() || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-600">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              下載
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex items-center justify-center min-h-[400px] bg-slate-900 rounded-lg">
          {loading && (
            <div className="text-slate-300">載入中...</div>
          )}
          
          {error && (
            <div className="text-center">
              <div className="text-red-400 mb-2">{error}</div>
              <Button
                variant="outline"
                onClick={loadImage}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                重新載入
              </Button>
            </div>
          )}
          
          {imageUrl && !loading && !error && (
            <img
              src={imageUrl}
              alt="提領憑證"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={() => setError('圖片載入失敗')}
            />
          )}
        </div>
        
        {imagePath && (
          <div className="text-xs text-slate-400 text-center">
            檔案路徑: {imagePath}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};