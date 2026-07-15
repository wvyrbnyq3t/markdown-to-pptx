// components
import { Link } from "react-router-dom";
import { Button } from "../mycomponents/components/Button";
import {
  Container,
  ContainerTitle,
  FlexContainer,
} from "../mycomponents/components/Container";
import { Page, PageContent } from "../mycomponents/components/PageLayout";
import { Stack } from "../mycomponents/components/Stack";

// stylesheets
import "../mycomponents/css/index.css";
import "../mycomponents/css/style.css";
import "../mycomponents/css/utilities.css";

const Home = () => {
  return (
    <Page>
      <PageContent>
        <Container pdng="md">
          <Stack gap="lg">
            <Container>
              <FlexContainer>
                <ContainerTitle level="2">使い方</ContainerTitle>
                <Button
                  variant="outlined"
                  className="u-mrgn--left-auto u-color--active"
                  asChild
                >
                  <Link to="/guide">ガイドページ</Link>
                </Button>
              </FlexContainer>
            </Container>
            <Container>
              <Button
                variant="filled"
                className="u-width--full u-color--white"
                asChild
              >
                <Link to="/editor">新規作成</Link>
              </Button>
            </Container>
          </Stack>
        </Container>
      </PageContent>
    </Page>
  );
};

export default Home;
