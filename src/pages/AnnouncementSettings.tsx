import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Megaphone, Pin, PinOff, Calendar, Send, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";

const AnnouncementSettings = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '一般',
    pinned: false
  });

  // Load announcements from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('announcements');
    if (saved) {
      setAnnouncements(JSON.parse(saved));
    } else {
      // No default announcements - start with empty list
      const defaultAnnouncements = [];
      setAnnouncements(defaultAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(defaultAnnouncements));
    }
  }, [profile?.username]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "重要": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "系統": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "一般": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "填寫錯誤",
        description: "請填寫標題和內容",
        variant: "destructive",
      });
      return;
    }

    if (selectedAnnouncement) {
      // Edit existing announcement
      const updatedAnnouncements = announcements.map(announcement => 
        announcement.id === selectedAnnouncement.id 
          ? {
              ...announcement,
              ...formData,
              publishDate: new Date().toLocaleString('zh-TW'),
              author: profile?.username || "管理員"
            }
          : announcement
      );
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
      
      toast({
        title: "公告更新成功",
        description: `已更新公告「${formData.title}」`,
      });
    } else {
      // Create new announcement
      const newAnnouncement = {
        id: Date.now(),
        ...formData,
        author: profile?.username || "管理員",
        publishDate: new Date().toLocaleString('zh-TW'),
        readCount: 0,
        commentCount: 0,
        published: false // 預設為未發布狀態
      };
      
      const updatedAnnouncements = [newAnnouncement, ...announcements];
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
      
      toast({
        title: "新增公告成功",
        description: `已發布公告「${formData.title}」`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      pinned: announcement.pinned
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const updatedAnnouncements = announcements.filter(announcement => announcement.id !== id);
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    
    toast({
      title: "刪除成功",
      description: "公告已刪除",
    });
  };

  const togglePin = (id: number) => {
    const updatedAnnouncements = announcements.map(announcement => 
      announcement.id === id 
        ? { ...announcement, pinned: !announcement.pinned }
        : announcement
    );
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    
    const announcement = announcements.find(a => a.id === id);
    toast({
      title: announcement?.pinned ? "已取消置頂" : "已設為置頂",
      description: `公告「${announcement?.title}」${announcement?.pinned ? "取消置頂" : "置頂"}成功`,
    });
  };

  const resetForm = () => {
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: '一般',
      pinned: false
    });
  };

  const handlePublish = (announcement) => {
    const updatedAnnouncements = announcements.map(a => 
      a.id === announcement.id ? { ...a, published: true } : a
    );
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    
    toast({
      title: "發布成功",
      description: `公告「${announcement.title}」已發布到團隊公告`,
    });
  };

  const handleUnpublish = (announcement) => {
    const updatedAnnouncements = announcements.map(a => 
      a.id === announcement.id ? { ...a, published: false } : a
    );
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    
    toast({
      title: "已取消發布",
      description: `公告「${announcement.title}」已從團隊公告中移除`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="text-treasure-gold border-treasure-border hover:bg-treasure-surface backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
            <div className="text-white">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-treasure-amber bg-clip-text text-transparent">
                🌟 公告設定
              </h1>
              <p className="text-treasure-gold/80">
                {team?.name} | {user?.username}
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增公告
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
              <DialogHeader>
                <DialogTitle className="text-treasure-gold text-xl">
                  <Megaphone className="w-5 h-5 inline mr-2" />
                  {selectedAnnouncement ? "編輯公告" : "新增公告"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-treasure-gold">公告標題</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="請輸入公告標題"
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-treasure-gold">公告內容</Label>
                  <Textarea
                    id="content"
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="請輸入公告內容..."
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-treasure-gold">公告類型</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-treasure-surface border-treasure-border">
                        <SelectItem value="一般">一般</SelectItem>
                        <SelectItem value="重要">重要</SelectItem>
                        <SelectItem value="系統">系統</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pinned"
                      checked={formData.pinned}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pinned: checked }))}
                    />
                    <Label htmlFor="pinned" className="text-treasure-gold">置頂公告</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                    className="border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                  >
                    {selectedAnnouncement ? "更新公告" : "發布公告"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-gold/20 rounded-lg">
                  <Megaphone className="w-5 h-5 text-treasure-gold" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">總公告數</p>
                  <p className="text-xl font-bold text-treasure-gold">{announcements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Pin className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">置頂公告</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {announcements.filter(a => a.pinned).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">本週新增</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {announcements.filter(a => {
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return new Date(a.publishDate) > weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Send className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">已發布公告</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {announcements.filter(a => a.published === true).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements List */}
        <div className="grid grid-cols-1 gap-4">
          {announcements
            .sort((a, b) => {
              // Sort by pinned first, then by date
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
            })
            .map((announcement) => (
            <Card key={announcement.id} className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-treasure-gold">{announcement.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(announcement.type)}>
                        {announcement.type}
                      </Badge>
                      {announcement.pinned && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Pin className="w-3 h-3 mr-1" />
                          置頂
                        </Badge>
                      )}
                      {announcement.published && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Send className="w-3 h-3 mr-1" />
                          已發布
                        </Badge>
                      )}
                      {announcement.published === false && (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          未發布
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {announcement.published ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnpublish(announcement)}
                        className="text-gray-400/70 hover:text-gray-400 hover:bg-gray-400/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublish(announcement)}
                        className="text-green-400/70 hover:text-green-400 hover:bg-green-400/10"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(announcement.id)}
                      className="text-treasure-gold/70 hover:text-treasure-gold hover:bg-treasure-surface/30"
                    >
                      {announcement.pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      className="text-treasure-gold/70 hover:text-treasure-gold hover:bg-treasure-surface/30"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-treasure-gold/80 whitespace-pre-wrap mb-4">
                  {announcement.content}
                </p>
                
                <div className="flex items-center justify-between text-sm text-treasure-gold/60">
                  <div className="flex items-center gap-4">
                    <span>發布者：{announcement.author}</span>
                    <span>發布時間：{announcement.publishDate}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>瀏覽：{announcement.readCount}</span>
                    <span>留言：{announcement.commentCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {announcements.length === 0 && (
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border text-center p-12">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-treasure-gold/30" />
            <h3 className="text-xl font-semibold text-treasure-gold mb-2">
              尚未發布任何公告
            </h3>
            <p className="text-treasure-gold/60 mb-4">
              點擊上方「新增公告」按鈕來發布第一則公告。
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSettings;