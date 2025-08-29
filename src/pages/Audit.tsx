import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, DollarSign, Image, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";

const Audit = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // 從 localStorage 載入實際審核資料
  const [auditItems, setAuditItems] = useState([]);

  useEffect(() => {
    const loadAuditRecords = () => {
      const savedAudits = JSON.parse(localStorage.getItem('auditRecords') || '[]');
      setAuditItems(savedAudits);
    };

    loadAuditRecords();
    
    // 監聽 localStorage 變化
    const handleStorageChange = () => {
      loadAuditRecords();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const allAuditItems = auditItems;

  // 審核操作處理函數
  const handleApprove = (item: any) => {
    const updatedItems = auditItems.map(audit => 
      audit.id === item.id ? { ...audit, status: 'approved', processDate: new Date().toLocaleString('zh-TW') } : audit
    );
    
    setAuditItems(updatedItems);
    localStorage.setItem('auditRecords', JSON.stringify(updatedItems));
    
    toast({
      title: "審核通過",
      description: `${item.type} 申請已通過審核`,
    });
  };

  const handleReject = (item: any) => {
    // 如果是提領申請，需要退還鑽石
    if (item.type === 'withdrawal') {
      // 創建退還記錄
      const refundRecord = {
        id: Date.now(),
        type: "獲得",
        amount: item.amount,
        reason: `提領申請被拒絕，退還鑽石`,
        date: new Date().toLocaleString('zh-TW'),
        category: "提領退還",
        participant: item.username
      };

      // 添加到錢包交易記錄
      const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      existingTransactions.unshift(refundRecord);
      localStorage.setItem('walletTransactions', JSON.stringify(existingTransactions));
      
      toast({
        title: "提領申請已拒絕",
        description: `${item.amount} 鑽石已退還至 ${item.username} 的錢包`,
      });
    } else {
      toast({
        title: "審核拒絕",
        description: `${item.type} 申請已被拒絕`,
      });
    }
    
    // 更新審核狀態
    const updatedItems = auditItems.map(audit => 
      audit.id === item.id ? { ...audit, status: 'rejected', processDate: new Date().toLocaleString('zh-TW') } : audit
    );
    
    setAuditItems(updatedItems);
    localStorage.setItem('auditRecords', JSON.stringify(updatedItems));
  };

  const clearAllAuditRecords = () => {
    localStorage.removeItem('auditRecords');
    setAuditItems([]);
    toast({
      title: "清空成功",
      description: "所有審核記錄已清空",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "待審核";
      case "approved":
        return "已通過";
      case "rejected":
        return "已拒絕";
      default:
        return "未知";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主頁
            </Button>
            <h1 className="text-2xl font-bold text-white">🔍 審核管理</h1>
          </div>
          
          {auditItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllAuditRecords}
              className="text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空記錄
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">待審核項目</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {allAuditItems.filter(item => item.status === "pending").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">已通過</p>
                  <p className="text-2xl font-bold text-green-400">
                    {allAuditItems.filter(item => item.status === "approved").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm">已拒絕</p>
                  <p className="text-2xl font-bold text-red-400">
                    {allAuditItems.filter(item => item.status === "rejected").length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Items List */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">審核項目列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-slate-300">載入中...</p>
                </div>
              ) : allAuditItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-600 rounded-lg p-4 border border-slate-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">
                          {item.type === 'withdrawal' ? `鑽石提領申請 - ${item.amount} 鑽石` : item.itemName || item.reason}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {getStatusText(item.status)}
                        </span>
                        {item.type === 'withdrawal' && (
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-slate-300 text-sm space-y-1">
                        <p><span className="text-slate-400">類型：</span>{item.type === 'withdrawal' ? '鑽石提領' : item.type}</p>
                        <p><span className="text-slate-400">申請者：</span>{item.username || item.submitter}</p>
                        <p><span className="text-slate-400">申請時間：</span>{item.submitDate || item.submitTime}</p>
                        {item.type === 'withdrawal' ? (
                          <p><span className="text-slate-400">提領金額：</span>{item.amount} 鑽石</p>
                        ) : (
                          <p><span className="text-slate-400">詳情：</span>{item.details}</p>
                        )}
                        {item.processDate && (
                          <p><span className="text-slate-400">處理時間：</span>{item.processDate}</p>
                        )}
                      </div>
                      
                      {/* 顯示提領憑證圖片 */}
                      {item.certificateImage && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage(item.certificateImage);
                              setImageModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Image className="w-4 h-4" />
                            查看提領憑證
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {item.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(item)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          通過
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          拒絕
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!loading && allAuditItems.length === 0 && (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300">目前沒有需要審核的項目</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Audit;