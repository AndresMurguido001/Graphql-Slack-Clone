import axios from "axios";

describe("user resolvers", () => {
  test("allusers", async () => {
    const response = await axios.post("http://localhost:8080/graphql", {
      query: `
          query {
              allUsers {
                  id 
                  username
                  email
              }
          }
          `
    });
    const { data } = response;
    expect(data).toMatchObject({
      data: {
        allUsers: []
      }
    });
  });

  test("register user", async () => {
    const response = await axios.post("http://localhost:8080/graphql", {
      query: `
      mutation{
        registerUser(username: "AndresTEST", email: "andres@test.com", password: "password"){
          ok
          errors{
            path
            message
          }
          user{
            email
            username
          }
        }
      }
          `
    });
    const { data } = response;
    expect(data).toMatchObject({
      data: {
        registerUser: {
          ok: true,
          errors: null,
          user: {
            email: "andres@test.com",
            username: "AndresTEST"
          }
        }
      }
    });
    const response2 = await axios.post("http://localhost:8080/graphql", {
      query: `
        mutation{
            login(email: "andres@test.com", password: "password"){
             token
             refreshToken
            }
          }
            `
    });

    const {
      data: {
        login: { token, refreshToken }
      }
    } = response2.data;
    const response3 = await axios.post(
      "http://localhost:8080/graphql",
      {
        query: `
        mutation{
            createTeam(name: "TESTTEAM"){
              ok
              team{
                name
              }
            }
          }
            `
      },
      {
        headers: {
          "x-token": token,
          "x-refreshToken": refreshToken
        }
      }
    );

    expect(response3.data).toMatchObject({
      data: {
        createTeam: {
          ok: true,
          team: {
            name: "TESTTEAM"
          }
        }
      }
    });
  });
});
