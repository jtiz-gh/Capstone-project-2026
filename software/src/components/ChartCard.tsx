import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "blue",
  },
} satisfies ChartConfig

type ChartCardProps = {
  chartData: { seconds: number; [key: string]: number }[]
  title: string
  yAxisLabel: string
  dataKey: string
}

export default function ChartCard({
  chartData,
  title,
  yAxisLabel,
  dataKey,
}: Readonly<ChartCardProps>) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="seconds"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line dataKey={dataKey} type="natural" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
