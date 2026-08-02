CORREZIONE AGGIORNAMENTO AUTOMATICO GITHUB

1. Caricare sul server TUTTI i file dello ZIP, inclusa la cartella assets/js.
2. Sovrascrivere index.html, download.html e assets/js/latest-release.js.
3. Dopo il caricamento aprire il sito con CTRL+F5 oppure in una finestra anonima.
4. La release GitHub deve essere pubblica, non Draft e non Pre-release.
5. La release deve contenere un file EXE, preferibilmente nominato:
   VegasKaraokePlayer_Setup_2_3_4.exe
6. Il sito interroga sempre GitHub a ogni apertura. Se /releases/latest fallisce,
   prova automaticamente l'elenco delle ultime 10 release.
7. Il parametro latest-release.js?v=3 forza il browser a scaricare il nuovo script.
