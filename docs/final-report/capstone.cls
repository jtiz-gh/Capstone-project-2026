\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{capstone}[2023/02/27 ECSE Capstone Project Report Template]

\LoadClass[a4paper]{article}

\renewcommand{\titlepage}[2]{
	\thispagestyle{empty}

	\begin{tikzpicture}[remember picture, overlay]
		\node [inner sep=0pt] at (current page.center) {#1};
		\node [anchor=center, inner sep=1.25cm, rectangle, fill=white, fill opacity=0.6, text opacity=1, minimum height=0.2\paperheight, minimum width=\paperwidth, text width=0.8\paperwidth] at (current page.center) {#2};
	\end{tikzpicture}
	
	\newpage
}

\RequirePackage{tikz}
