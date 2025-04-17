@echo off

REM Clean up any existing files
if exist project-proposal.pdf del project-proposal.pdf
if exist template.pdf del template.pdf

REM Compile the document
pdflatex -jobname=project-proposal template
pdflatex -jobname=project-proposal template
pdflatex -jobname=project-proposal template

REM Clean up temporary files
del *.aux
del *.log
del *.toc
del *.fls
del *.fdb_latexmk
del *.synctex.gz

REM Open the PDF
start "" project-proposal.pdf
