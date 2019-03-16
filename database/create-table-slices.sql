--
-- Name: slices; Type: TABLE;
--

CREATE TABLE slices (
    id character(64) NOT NULL,
    json json NOT NULL
);

--
-- Name: slices slices_pkey; Type: CONSTRAINT;
--

ALTER TABLE ONLY slices
    ADD CONSTRAINT slices_pkey PRIMARY KEY (id);

--
-- Name: slices; Type: ACL;
--

GRANT ALL ON TABLE slices TO soundslice;
