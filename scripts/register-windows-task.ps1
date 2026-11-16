# Registers a Windows Scheduled Task that runs every hour in the background
$taskName = "ChoreRouletteOverdueCheck"
$action = New-ScheduledTaskAction -Execute "node.exe" -Argument "c:\projetcs\chore-roulette\scripts\check-overdue.mjs" -WorkingDirectory "c:\projetcs\chore-roulette"
$trigger = New-ScheduledTaskTrigger -Daily -At 12:00AM
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Minutes 30)).Repetition

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Checks overdue chores and sends SMS alerts for Chore Roulette" -Force

Write-Host "✅ Windows Scheduled Task '$taskName' registered successfully to run every 30 minutes in the background!"
