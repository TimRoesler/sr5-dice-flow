// Core-rulebook matrix action reference (GRW p. 234–241): required marks, limit and
// legality per action. Illegal = every attack or sleaze action (GRW p. 231); on a failed
// attack action the attacker takes 1 box unresisted matrix damage per defender net hit,
// on a failed sleaze action the target places a mark and alerts its owner. Advisory only.
export type MatrixMarks=number|'owner'|'special';
export type MatrixLimit='attack'|'sleaze'|'data_processing'|'firewall'|'none';
export interface MatrixActionInfo {key:string;names:string[];marks:MatrixMarks;limit:MatrixLimit;note?:'dumpshock'|'databombSet'|'databombDisarm'|'fullDefense'}
const action=(key:string,names:string[],marks:MatrixMarks,limit:MatrixLimit,note?:MatrixActionInfo['note']):MatrixActionInfo=>({key,names:names.map(name=>name.toLowerCase()),marks,limit,note});
export const MATRIX_ACTIONS:MatrixActionInfo[]=[
 action('bruteForce',['Brute Force'],0,'attack'),
 action('changeIcon',['Change Icon','Icon verändern'],'owner','data_processing'),
 action('checkOverwatch',['Check Overwatch Score','Overwatch-Wert bestimmen'],0,'sleaze'),
 action('controlDevice',['Control Device','Gerät steuern'],'special','sleaze'),
 action('crackFile',['Crack File','Datei cracken'],1,'attack'),
 action('crashProgram',['Crash Program','Programm abstürzen lassen'],1,'attack'),
 action('dataSpike',['Data Spike','Datenspike'],0,'attack'),
 action('disarmDataBomb',['Disarm Data Bomb','Datenbombe entschärfen'],0,'firewall','databombDisarm'),
 action('editFile',['Edit File','Datei editieren'],1,'data_processing'),
 action('enterHost',['Enter/Exit Host','Host betreten/verlassen'],1,'none'),
 action('eraseMark',['Erase Mark','Marke löschen'],'special','attack'),
 action('eraseSignature',['Erase Matrix Signature','Matrixsignatur löschen'],0,'attack'),
 action('formatDevice',['Format Device','Gerät formatieren'],3,'sleaze'),
 action('fullDefense',['Full Matrix Defense','Volle Matrixabwehr'],0,'none','fullDefense'),
 action('gridHop',['Grid Hop','Gitterwechsel'],0,'none'),
 action('hackOnTheFly',['Hack on the Fly','Eiliges Hacken'],0,'sleaze'),
 action('hide',['Hide','Verstecken'],0,'sleaze'),
 action('inviteMark',['Invite Mark','Marke einladen'],'owner','none'),
 action('jackOut',['Jack Out','Ausstöpseln'],'owner','firewall','dumpshock'),
 action('jamSignals',['Jam Signals','Signal stören'],'owner','attack'),
 action('jumpInto',['Jump Into Rigged Device','In ein Gerät springen'],3,'data_processing'),
 action('matrixPerception',['Matrix Perception','Matrixwahrnehmung'],0,'data_processing'),
 action('matrixSearch',['Matrix Search','Matrixsuche'],0,'data_processing'),
 action('rebootDevice',['Reboot Device','Gerät neu starten'],3,'data_processing'),
 action('sendMessage',['Send Message','Nachricht übermitteln'],1,'data_processing'),
 action('setDataBomb',['Set Data Bomb','Datenbombe legen'],1,'sleaze','databombSet'),
 action('snoop',['Snoop','Übertragung abfangen'],1,'sleaze'),
 action('spoofCommand',['Spoof Command','Befehl vortäuschen'],1,'sleaze'),
 action('traceIcon',['Trace Icon','Icon aufspüren'],2,'data_processing'),
];
export const isIllegalAction=(info?:MatrixActionInfo)=>Boolean(info&&(info.limit==='attack'||info.limit==='sleaze'));
export function matrixActionInfo(name?:string){if(!name)return undefined;const needle=name.trim().toLowerCase();return MATRIX_ACTIONS.find(info=>info.names.includes(needle))}
