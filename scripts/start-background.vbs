' Runs the Chore Roulette background daemon completely hidden in the background
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\projetcs\chore-roulette"
WshShell.Run "node scripts/daemon.mjs", 0, False
