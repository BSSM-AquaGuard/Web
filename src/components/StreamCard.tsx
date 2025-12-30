import { Camera, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraItem } from "@/types";

export function StreamCard({ cam, onDelete }: { cam: CameraItem; onDelete?: (cam: CameraItem) => void }) {
  const typeLabel = cam.type === "cctv" ? "CCTV" : cam.type === "ai_cam" ? "AI" : "ESP32-CAM";

  return (
    <Card className="rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> {cam.name}
          </span>
          <div className="flex items-center gap-1">
            <Badge variant="secondary">{typeLabel}</Badge>
            {onDelete ? (
              <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => onDelete(cam)} aria-label="카메라 삭제">
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border bg-muted/30 h-44 flex items-center justify-center text-xs text-muted-foreground">
          {/* 운영 시: HLS -> <video>, MJPEG -> <img>, RTSP -> 서버 변환 후 연결 */}
          스트림 연결 위치
        </div>
        <div className="text-xs">
          <div className="text-muted-foreground">Stream URL</div>
          <div className="font-mono break-all">{cam.streamUrl}</div>
        </div>
      </CardContent>
    </Card>
  );
}
