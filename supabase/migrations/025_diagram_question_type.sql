-- Add diagram question type and diagram_data column
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'diagram';

-- plot_point: user clicks on coordinate plane to place a point as their answer
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'plot_point';

-- Diagram data: stores coordinate plane config, plotted functions, points, etc.
-- Used by the client to render an SVG diagram alongside the question.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  diagram_data JSONB DEFAULT NULL;

-- For plot_point questions: the correct coordinate and tolerance
-- Format: {"x": 2, "y": 3, "tolerance": 0.5}
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  correct_point JSONB DEFAULT NULL;
