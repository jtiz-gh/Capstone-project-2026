@echo off

REM Clean up any existing files
if exist project-proposal.pdf del project-proposal.pdf
if exist template.pdf del template.pdf

REM Compile the document
pdflatex -jobname=final-report template
pdflatex -jobname=final-report template
pdflatex -jobname=final-report template
start "" final-report.pdf

REM Clean up temporary files
echo Cleaning output files
del final-report.aux
del final-report.toc
del *.aux
del *.log
del *.toc
del *.fls
del *.fdb_latexmk
del *.synctex.gz

REM Open the PDF
start "" project-proposal.pdf
