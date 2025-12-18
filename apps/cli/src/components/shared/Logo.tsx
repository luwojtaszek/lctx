import { Box, Text } from "ink";

interface LogoProps {
  version?: string;
  cwd?: string;
}

// Space Invader logo using background colors for reliable rendering
const P = ({ c = "cyan" }: { c?: string }) => (
  <Text backgroundColor={c}> </Text>
);
const S = () => <Text> </Text>;
const E = () => <Text> </Text>; // Eye (transparent)

export function Logo({ version = "0.1.0", cwd }: LogoProps) {
  const displayPath = cwd ? cwd.replace(process.env.HOME || "", "~") : "";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box alignItems="flex-start">
        <Box flexDirection="column" marginRight={1}>
          <Text color="gray"> *</Text>
          <Text color="gray"> *</Text>
          <Text color="gray"> *</Text>
        </Box>
        <Box flexDirection="column" marginRight={2}>
          <Text>
            <S />
            <S />
            <P />
            <S />
            <P />
            <S />
            <S />
          </Text>
          <Text>
            <S />
            <P />
            <E />
            <P />
            <E />
            <P />
            <S />
          </Text>
          <Text>
            <S />
            <S />
            <P />
            <P />
            <P />
            <S />
            <S />
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text>
            <Text bold color="cyan">
              lctx
            </Text>{" "}
            <Text color="gray">v{version}</Text>
          </Text>
          <Text color="white">Local Context Aggregator</Text>
          <Text color="gray">{displayPath}</Text>
        </Box>
      </Box>
    </Box>
  );
}
