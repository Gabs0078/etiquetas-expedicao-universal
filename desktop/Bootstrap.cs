using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
class TagEX {
    [STAThread]
    static void Main() {
        try {
            string pasta = AppDomain.CurrentDomain.BaseDirectory;
            string nome = Path.GetFileNameWithoutExtension(Application.ExecutablePath);
            string script = Path.Combine(pasta, "desktop", nome.StartsWith("Instalar") ? "instalar.ps1" : "iniciar.ps1");
            if (!File.Exists(script)) throw new Exception("Extraia todo o ZIP antes de abrir o TagEX. O executável precisa continuar junto das outras pastas do pacote.");
            var info = new ProcessStartInfo("powershell.exe", "-NoProfile -WindowStyle Hidden -STA -ExecutionPolicy Bypass -File \"" + script + "\"");
            info.UseShellExecute = false; info.CreateNoWindow = true;
            Process.Start(info);
        } catch (Exception e) { MessageBox.Show(e.Message, "TagEX", MessageBoxButtons.OK, MessageBoxIcon.Information); }
    }
}
