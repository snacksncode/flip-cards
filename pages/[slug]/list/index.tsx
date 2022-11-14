import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import styles from "@styles/List.module.scss";
import classNames from "classnames";
import getAccentForClass from "@utils/getAccentForClass";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { GetStaticPropsContext } from "next";
import groupBy from "@utils/groupBy";
import { ArrowCircleDown2, ArrowCircleRight2, Back, Danger } from "iconsax-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  data: APIData | null;
}

const FormatedData = ({ data, type }: { data: string; type: ClassString }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <div className={styles.answer}>
        {type !== "math" ? (
          <span>{data}</span>
        ) : (
          <>
            {!loaded && <span>Loading...</span>}
            <span style={{ display: loaded ? "block" : "none", fontSize: "1.5rem" }}>
              <MathJax onInitTypeset={() => setLoaded(true)}>{String.raw`${data}`}</MathJax>
            </span>
          </>
        )}
      </div>
    </>
  );
};

const DataWrapper = ({ type, children }: PropsWithChildren<{ type: ClassString }>) => {
  if (type === "math")
    return (
      <MathJaxContext config={{ options: { enableMenu: false } }} hideUntilTypeset={"first"}>
        {children}
      </MathJaxContext>
    );
  return <>{children}</>;
};

export default function CardId({ data }: Props) {
  const headerRef = useRef<HTMLHeadingElement | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [dupsData, setDupsData] = useState<QuestionData[][]>();

  const topContainerClasses = classNames(styles["top__container"], {
    [`${styles["top__container--sticky"]}`]: isSticky,
  });

  useEffect(() => {
    if (!data) return;
    const grouped = groupBy(data.questionData, (q) => q.question);
    const values = Object.values(grouped);
    const dups = values.filter((v) => v.length > 1);
    if (dups.length > 0) setDupsData(dups);
  }, [data]);

  useEffect(() => {
    const cachedRef = headerRef.current;
    if (cachedRef == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(entry.intersectionRatio < 1);
      },
      { threshold: [1] }
    );

    observer.observe(cachedRef);
    return () => {
      observer.unobserve(cachedRef);
    };
  }, []);

  if (!data) return <div>Building...</div>;
  return (
    <DataWrapper type={data.class}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.container}
        style={{ margin: "2rem auto 0", ["--clr-accent" as any]: getAccentForClass(data.class) }}
      >
        <div>
          <Link href="/">
            <a className={styles.backButton}>
              <Back variant="Outline" size="1.125rem" color="currentColor" />
              Go Back
            </a>
          </Link>
        </div>
        <h1 className={styles.title}>
          List view for <br />
          <span>
            {data.title}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1, transition: { delay: 0.3 } }}
              className={styles.line}
            />
          </span>
        </h1>
      </motion.div>
      {dupsData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.3 } }}
          className={classNames(styles.container, styles.dupWarning)}
        >
          <h1>
            <Danger size="32" color="currentColor" variant="Bold" />
            Duplicates found in this dataset
          </h1>
          <p>Please combine them into one for a better learning experience by using e.x. a comma</p>
          <h3>List of duplicates</h3>
          <ol>
            {dupsData.map((dup) => {
              return <li key={dup[0].question}>{dup[0].question}</li>;
            })}
          </ol>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.3 } }}
        ref={headerRef}
        className={topContainerClasses}
        style={{ ["--clr-accent" as any]: getAccentForClass(data.class) }}
      >
        <div className={styles.container}>
          <header className={styles.top}>
            <p>Question</p>
            <ArrowCircleRight2 size="32" color="currentColor" variant="Bold" />
            <p>Answer</p>
          </header>
        </div>
      </motion.div>
      <div className={styles.container} style={{ ["--clr-accent" as any]: getAccentForClass(data.class) }}>
        <div className={styles.list}>
          {data.questionData.map((d, index) => {
            let { answer, question } = d;
            return (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.05 * index + 0.3 } }}
                className={styles.list__item}
                key={`${question}-${answer}`}
              >
                <div className={styles.question}>{question}</div>
                <div className={styles.spacer}></div>
                <ArrowCircleDown2 size="32" color="var(--clr-accent)" variant="Bold" />
                <FormatedData type={data.class} data={answer} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </DataWrapper>
  );
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const apiData = await fetch(`${apiUrl}/entries?slug=${params?.slug}`);
  let dataArray: APIData[] = await apiData.json();

  if (!dataArray.length) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const rawData = dataArray[0];
  return {
    props: {
      data: rawData,
    },
    revalidate: 60,
  };
};

export async function getStaticPaths() {
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  const rawData = await fetch(`${apiUrl}/entries`);
  let data: APIData[] = await rawData.json();

  const paths = data.map((d) => {
    return {
      params: { slug: d.slug },
    };
  });

  return { paths, fallback: true };
}
