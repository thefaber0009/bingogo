import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';

export default function DashboardSettingsDialog({ open, onOpenChange }) {
  const [appName, setAppName] = useState('BingoManía');
  const [faviconUrl, setFaviconUrl] = useState('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69811affc30258284f5a5643/a24656e95_image.png');
  const [logoUrl, setLogoUrl] = useState('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69811affc30258284f5a5643/a24656e95_image.png');
  const [faviconPreview, setFaviconPreview] = useState(faviconUrl);
  const [logoPreview, setLogoPreview] = useState(logoUrl);
  const [uploading, setUploading] = useState(false);

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        setFaviconPreview(URL.createObjectURL(file));
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFaviconUrl(file_url);
      } catch (error) {
        alert('Error al subir el favicon');
      }
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        setLogoPreview(URL.createObjectURL(file));
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setLogoUrl(file_url);
      } catch (error) {
        alert('Error al subir el logo');
      }
      setUploading(false);
    }
  };

  const handleSave = () => {
    // Aquí se guardería la configuración en el localStorage o en una entidad
    localStorage.setItem('appName', appName);
    localStorage.setItem('faviconUrl', faviconUrl);
    localStorage.setItem('logoUrl', logoUrl);
    
    // Actualizar favicon en la página
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    alert('Configuración guardada correctamente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nombre de la Página */}
          <div>
            <Label>Nombre de la Página</Label>
            <Input
              placeholder="Ej: BingoManía"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Nombre que aparecerá en el navegador</p>
          </div>

          {/* Favicon */}
          <div>
            <Label>Favicon</Label>
            <div className="flex gap-3 mt-2">
              <div className="flex-1">
                <label className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center">
                  {faviconPreview ? (
                    <div className="text-xs text-blue-600 font-semibold">✓ Cargado</div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Subir favicon</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFaviconUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>
              {faviconPreview && (
                <div className="w-16 h-16 border rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                  <img src={faviconPreview} alt="Favicon preview" className="w-12 h-12 object-contain" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Icono que aparece en la pestaña del navegador</p>
          </div>

          {/* Logo */}
          <div>
            <Label>Logo de la Página</Label>
            <div className="flex gap-3 mt-2">
              <div className="flex-1">
                <label className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center">
                  {logoPreview ? (
                    <div className="text-xs text-blue-600 font-semibold">✓ Cargado</div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Subir logo</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>
              {logoPreview && (
                <div className="w-16 h-16 border rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                  <img src={logoPreview} alt="Logo preview" className="w-14 h-14 object-contain" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Logo que aparecerá en el sidebar y banner</p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={uploading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {uploading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}