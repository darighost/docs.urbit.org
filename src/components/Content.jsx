import React, { useState } from "react";
import Link from "next/link";
import { join } from "path";
import {
  Header,
  Sidebar,
  MenuTray,
  ContentNav,
  FragmentNav,
  Markdown,
  getPage,
  getPreviousPost,
  getNextPost,
  capitalize,
} from "@urbit/fdn-design-system";
import markdocVariables from "../lib/markdocVariables";

export default function Content({
  posts,
  data,
  markdown,
  params,
  previousPost,
  nextPost,
  root,
  path,
}) {
  const firstCrumb = path.split("#")[0];
  const md = JSON.parse(markdown);

  return (
    <div className="flex h-full w-full">
      <MenuTray>
        <ContentNav posts={posts} root={root} firstCrumb={firstCrumb} />
      </MenuTray>
      <Sidebar className="hidden md:flex" left>
        <ContentNav
          posts={posts}
          root={root}
          firstCrumb={firstCrumb}
        />
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0 px-5 md:pr-8 xl:pr-5">
        <Header className="md:hidden">
          {breadcrumbs(posts, params.slug || [], root)}
        </Header>
        <h1 className="font-medium text-5xl text-white mt-3 mb-10">{data.title}</h1>
        <div className="markdown technical">
          <Markdown.render content={md} />
        </div>
      </div>
      <Sidebar className="hidden lg:flex" right>
        <FragmentNav
          markdown={md}
          key={params.slug?.join("/") || Math.random()}
        />
      </Sidebar>
    </div>
  );
}

export const breadcrumbs = (posts, paths, root) => {
  const results = [
    <Link className={paths.length > 0 ? "text-brite" : ""} href={`/${root}`}>
      {capitalize(root)}
    </Link>,
  ];
  let thisLink = `/${root}`;
  paths.forEach((path, i) => {
    const page = posts.pages?.filter((p) => p.slug === path)?.[0];
    posts = posts.children[path];
    thisLink = join(thisLink, path);
    results.push(
      <span>/</span>,
      <Link
        className={i + 1 < paths.length ? "text-brite" : ""}
        href={thisLink}
      >
        {posts?.title || page?.title}
      </Link>
    );
  });
  return results;
};

export function getStaticProps(params, root, posts) {
  const { data, content } = getPage(
    join(process.cwd(), `content/${root}`, params.slug?.join("/") || "/"),
    true
  );

  const previousPost =
    getPreviousPost(
      params.slug?.slice(-1).join("") || root,
      ["title", "slug", "weight"],
      join(root, params.slug?.slice(0, -1).join("/") || "/"),
      "weight"
    ) || null;

  const nextPost =
    getNextPost(
      params.slug?.slice(-1).join("") || root,
      ["title", "slug", "weight"],
      join(root, params.slug?.slice(0, -1).join("/") || "/"),
      "weight"
    ) || null;

  const markdown = JSON.stringify(
    Markdown.parse({
      post: { content: String.raw`${content}` },
      variables: markdocVariables,
    })
  );

  return { props: { posts, data, markdown, params, previousPost, nextPost } };
}

export function getStaticPaths(root, posts) {
  const slugs = [];

  const allHrefs = (thisLink, tree) => {
    slugs.push(thisLink, ...tree.pages.map((e) => join(thisLink, e.slug)));
    allHrefsChildren(thisLink, tree.children);
  };

  const allHrefsChildren = (thisLink, children) => {
    Object.entries(children).map(([childSlug, child]) => {
      allHrefs(join(thisLink, childSlug), child);
    });
  };

  allHrefs(`/${root}`, posts);
  return {
    paths: slugs,
    fallback: false,
  };
}
