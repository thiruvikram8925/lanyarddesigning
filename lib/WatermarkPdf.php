<?php
require_once __DIR__ . "/vendor/autoload.php";

class WatermarkPdf extends \setasign\Fpdi\Fpdi {
    private $angle = 0;

    public function Rotate($angle, $x = -1, $y = -1) {
        if ($x == -1) $x = $this->x;
        if ($y == -1) $y = $this->y;
        if ($this->angle != 0) $this->_out("Q");
        $this->angle = $angle;
        if ($angle != 0) {
            $angle *= M_PI / 180;
            $c = cos($angle); $s = sin($angle);
            $cx = $x * $this->k; $cy = ($this->h - $y) * $this->k;
            $this->_out(sprintf("q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm",
                $c, $s, -$s, $c, $cx, $cy, -$cx, -$cy));
        }
    }

    public function _endpage() {
        if ($this->angle != 0) { $this->angle = 0; $this->_out("Q"); }
        parent::_endpage();
    }

    /**
     * Apply tiled "GOTEK" watermark across all pages.
     * The original file is NEVER modified - everything is done in memory.
     */
    public function applyWatermark($filePath, $projectName) {
        $pageCount = $this->setSourceFile($filePath);

        for ($i = 1; $i <= $pageCount; $i++) {
            $tpl = $this->importPage($i);
            $size = $this->getTemplateSize($tpl);
            $this->AddPage($size["orientation"], [$size["width"], $size["height"]]);
            $this->useTemplate($tpl);

            // Tile "GOTEK" watermark across the entire page
            $this->SetFont("Helvetica", "B", 48);
            $this->SetTextColor(200, 200, 200);

            $stepX = 90;
            $stepY = 80;

            for ($y = -20; $y < $size["height"] + 40; $y += $stepY) {
                for ($x = -40; $x < $size["width"] + 40; $x += $stepX) {
                    $this->Rotate(45, $x + 30, $y + 10);
                    $this->SetXY($x, $y);
                    $this->Cell(0, 0, "GOTEK");
                    $this->Rotate(0);
                }
            }
        }

        header("Content-Type: application/pdf");
        header("Content-Disposition: inline; filename=\"" . ($projectName ?? "download") . ".pdf\"");
        $this->Output("I");
    }
}
