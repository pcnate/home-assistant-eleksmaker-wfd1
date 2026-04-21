[Setup]
AppName=EleksWFD Monitor
AppVersion=1.0.0
AppPublisher=Nathan Baker
AppPublisherURL=https://github.com/pcnate
DefaultDirName={autopf}\EleksWFD Monitor
DefaultGroupName=EleksWFD Monitor
OutputDir=..\dist
OutputBaseFilename=EleksWFD-Monitor-Setup
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\eleks-monitor.exe
ChangesEnvironment=yes
SetupIconFile=icon.ico
WizardStyle=modern

[Types]
Name: "full"; Description: "Full installation (Monitor + System Tray)"
Name: "compact"; Description: "Monitor only"
Name: "custom"; Description: "Custom"; Flags: iscustom

[Components]
Name: "monitor"; Description: "EleksWFD Monitor"; Types: full compact custom; Flags: fixed
Name: "tray"; Description: "System Tray Launcher"; Types: full

[InstallDelete]
; Stop running processes before overwriting files
Type: files; Name: "{app}\eleks-monitor.running.exe"

[Files]
Source: "..\dist\eleks-monitor.exe"; DestDir: "{app}"; Flags: ignoreversion; Components: monitor
Source: "..\dist\eleks-tray.exe"; DestDir: "{app}"; Flags: ignoreversion; Components: tray

[Icons]
Name: "{group}\EleksWFD Monitor"; Filename: "{app}\eleks-monitor.exe"; Components: monitor
Name: "{group}\EleksWFD Monitor (Daemon)"; Filename: "{app}\eleks-monitor.exe"; Parameters: "-d"; Components: monitor
Name: "{group}\EleksWFD Tray"; Filename: "{app}\eleks-tray.exe"; Components: tray
Name: "{group}\Edit Configuration"; Filename: "notepad.exe"; Parameters: """{app}\.env"""; Components: monitor
Name: "{group}\Uninstall EleksWFD Monitor"; Filename: "{uninstallexe}"
Name: "{userstartup}\EleksWFD Tray"; Filename: "{app}\eleks-tray.exe"; Components: tray; Tasks: autostart

[Tasks]
Name: "addtopath"; Description: "Add to PATH (allows running eleks-monitor from any terminal)"; Flags: unchecked
Name: "autostart"; Description: "Start tray launcher on Windows login"; Components: tray

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Tasks: addtopath; Check: NeedsAddPath( ExpandConstant( '{app}' ) )

[Run]
Filename: "{app}\eleks-tray.exe"; Description: "Launch EleksWFD Tray"; Flags: nowait postinstall skipifsilent; Components: tray
Filename: "{app}\eleks-monitor.exe"; Description: "Launch EleksWFD Monitor"; Flags: nowait postinstall skipifsilent; Components: monitor; Check: not WizardIsComponentSelected('tray')

[UninstallRun]
Filename: "taskkill"; Parameters: "/f /im eleks-monitor.exe"; Flags: runhidden; RunOnceId: "KillMonitor"
Filename: "taskkill"; Parameters: "/f /im eleks-tray.exe"; Flags: runhidden; RunOnceId: "KillTray"

[Code]
var
  ConfigPage: TInputQueryWizardPage;
  SensorPage: TWizardPage;
  SensorEdits: array[0..12] of TEdit;


(* Parse a KEY=VALUE from a line, return the value if the key matches *)
function ParseEnvValue( const Line, Key: string ): string;
begin
  Result := '';
  if Pos( Key + '=', Line ) = 1 then
    Result := Copy( Line, Length( Key ) + 2, MaxInt );
end;


(* Read a value from an existing .env file *)
function ReadEnvKey( const EnvPath, Key: string ): string;
var
  Lines: TArrayOfString;
  I: Integer;
  Val: string;
begin
  Result := '';
  if not FileExists( EnvPath ) then Exit;
  if not LoadStringsFromFile( EnvPath, Lines ) then Exit;

  for I := 0 to GetArrayLength( Lines ) - 1 do
  begin
    Val := ParseEnvValue( Lines[I], Key );
    if Val <> '' then Result := Val;
  end;
end;


procedure CreateSensorField( Page: TWizardPage; Idx: Integer; Caption: string; Col, Row: Integer; EnvPath, EnvKey, DefVal: string );
var
  Lbl: TLabel;
  Ed: TEdit;
  ColLeft, RowTop, ColWidth: Integer;
  Val: string;
begin
  ColWidth := ( Page.SurfaceWidth - 16 ) div 2;
  ColLeft := Col * ( ColWidth + 16 );
  RowTop := Row * 38;

  Lbl := TLabel.Create( Page );
  Lbl.Parent := Page.Surface;
  Lbl.Left := ColLeft;
  Lbl.Top := RowTop;
  Lbl.Width := 80;
  Lbl.Caption := Caption + ':';

  Ed := TEdit.Create( Page );
  Ed.Parent := Page.Surface;
  Ed.Left := ColLeft + 84;
  Ed.Top := RowTop - 2;
  Ed.Width := ColWidth - 84;

  Val := ReadEnvKey( EnvPath, EnvKey );
  if Val = '' then Val := DefVal;
  Ed.Text := Val;

  SensorEdits[Idx] := Ed;
end;


procedure InitializeWizard;
var
  EnvPath, Val: string;
begin
  EnvPath := ExpandConstant( '{autopf}\EleksWFD Monitor\.env' );

  (* Page 1: Connection *)
  ConfigPage := CreateInputQueryPage( wpSelectTasks,
    'Home Assistant Configuration',
    'Enter your Home Assistant connection details.',
    'These values will be saved to .env in the install directory.' );

  ConfigPage.Add( 'Machine Name:', False );
  ConfigPage.Add( 'Home Assistant URL:', False );
  ConfigPage.Add( 'Long-Lived Access Token:', False );

  Val := ReadEnvKey( EnvPath, 'MACHINE_NAME' );
  if Val = '' then Val := GetComputerNameString;
  ConfigPage.Values[0] := Val;

  Val := ReadEnvKey( EnvPath, 'HA_URL' );
  if Val = '' then Val := 'http://homeassistant.local:8123/api/states/';
  ConfigPage.Values[1] := Val;

  ConfigPage.Values[2] := ReadEnvKey( EnvPath, 'HA_TOKEN' );

  (* Page 2: Sensor Mapping — two-column custom layout *)
  SensorPage := CreateCustomPage( ConfigPage.ID,
    'AIDA64 Sensor Mapping',
    'Configure which AIDA64 sensors to read. Change only if your hardware differs.' );

  CreateSensorField( SensorPage, 0, 'CPU Usage',      0, 0,   EnvPath, 'SENSOR_CPU_USAGE',      'SCPUUTI' );
  CreateSensorField( SensorPage, 1, 'CPU Temp',        0, 1,   EnvPath, 'SENSOR_CPU_TEMP',       'TCPU' );
  CreateSensorField( SensorPage, 2, 'CPU Clock',       0, 2,   EnvPath, 'SENSOR_CPU_CLOCK',      'SCPUCLK' );
  CreateSensorField( SensorPage, 3, 'GPU Usage',       0, 3,   EnvPath, 'SENSOR_GPU_USAGE',      'SGPU1UTI' );
  CreateSensorField( SensorPage, 4, 'GPU Temp',        0, 4,   EnvPath, 'SENSOR_GPU_TEMP',       'TGPU1' );
  CreateSensorField( SensorPage, 5, 'GPU Temp Hot',    0, 5,   EnvPath, 'SENSOR_GPU_TEMP_HOT',   'TGPU1HOT' );
  CreateSensorField( SensorPage, 6, 'RAM Usage',       0, 6,   EnvPath, 'SENSOR_RAM_USAGE',      'SMEMUTI' );
  CreateSensorField( SensorPage, 7, 'Disk Activity',   1, 0,   EnvPath, 'SENSOR_DISK_ACTIVITY',  'SDSK1ACT' );
  CreateSensorField( SensorPage, 8, 'Disk Read',       1, 1,   EnvPath, 'SENSOR_DISK_READ',      'SDSK1READSPD' );
  CreateSensorField( SensorPage, 9, 'Disk Write',      1, 2,   EnvPath, 'SENSOR_DISK_WRITE',     'SDSK1WRITESPD' );
  CreateSensorField( SensorPage, 10, 'Battery %',      1, 3,   EnvPath, 'SENSOR_BATTERY_PERC',   'SBATTLVL' );
  CreateSensorField( SensorPage, 11, 'Battery Volt',   1, 4,   EnvPath, 'SENSOR_BATTERY_VOLT',   'VBATT' );
  CreateSensorField( SensorPage, 12, 'Power State',    1, 5,   EnvPath, 'SENSOR_POWER_STATE',    'SPWRSTATE' );
end;



(* Check if the install dir is already in PATH *)
function NeedsAddPath( Param: string ): Boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue( HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath ) then
  begin
    Result := True;
    Exit;
  end;
  Result := Pos( ';' + Uppercase( Param ) + ';', ';' + Uppercase( OrigPath ) + ';' ) = 0;
end;


function PrepareToInstall( var NeedsRestart: Boolean ): String;
var
  ResultCode: Integer;
begin
  Result := '';
  Exec( 'taskkill', '/f /im eleks-monitor.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode );
  Exec( 'taskkill', '/f /im eleks-tray.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode );
end;


procedure CurStepChanged( CurStep: TSetupStep );
var
  EnvFile: string;
begin
  if CurStep = ssPostInstall then
  begin
    EnvFile := ExpandConstant( '{app}\.env' );
    SaveStringToFile( EnvFile,
      'MACHINE_NAME=' + ConfigPage.Values[0] + #13#10 +
      'HA_URL=' + ConfigPage.Values[1] + #13#10 +
      'HA_TOKEN=' + ConfigPage.Values[2] + #13#10 +
      'SENSOR_CPU_USAGE=' + SensorEdits[0].Text + #13#10 +
      'SENSOR_CPU_TEMP=' + SensorEdits[1].Text + #13#10 +
      'SENSOR_CPU_CLOCK=' + SensorEdits[2].Text + #13#10 +
      'SENSOR_GPU_USAGE=' + SensorEdits[3].Text + #13#10 +
      'SENSOR_GPU_TEMP=' + SensorEdits[4].Text + #13#10 +
      'SENSOR_GPU_TEMP_HOT=' + SensorEdits[5].Text + #13#10 +
      'SENSOR_RAM_USAGE=' + SensorEdits[6].Text + #13#10 +
      'SENSOR_DISK_ACTIVITY=' + SensorEdits[7].Text + #13#10 +
      'SENSOR_DISK_READ=' + SensorEdits[8].Text + #13#10 +
      'SENSOR_DISK_WRITE=' + SensorEdits[9].Text + #13#10 +
      'SENSOR_BATTERY_PERC=' + SensorEdits[10].Text + #13#10 +
      'SENSOR_BATTERY_VOLT=' + SensorEdits[11].Text + #13#10 +
      'SENSOR_POWER_STATE=' + SensorEdits[12].Text + #13#10,
      False );
  end;
end;
